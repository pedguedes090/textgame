import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ShopItem } from 'src/entities/shop-item.entity';
import { Item } from 'src/entities/item.entity';
import { User } from 'src/entities/user.entity';
import { UserInventory } from 'src/entities/user-inventory.entity';
import { QuestProgressService } from 'src/common/services/quest-progress.service';
import { ItemsService } from '../items/items.service';

@Injectable()
export class ShopService {
  constructor(
    @InjectRepository(ShopItem)
    private readonly shopItemRepo: Repository<ShopItem>,
    @InjectRepository(Item)
    private readonly itemRepo: Repository<Item>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly itemsService: ItemsService,
    private readonly questProgressService: QuestProgressService,
    private readonly dataSource: DataSource,
  ) {}

  async listShopItems(category?: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const queryBuilder = this.shopItemRepo
      .createQueryBuilder('shop')
      .leftJoinAndSelect('shop.item_id', 'item')
      .where('shop.available = :available', { available: true })
      .orderBy('shop.category', 'ASC')
      .addOrderBy('shop.price_gold', 'ASC')
      .skip(skip)
      .take(limit);

    if (category) {
      queryBuilder.andWhere('shop.category = :category', { category });
    }

    const [shopItems, total] = await queryBuilder.getManyAndCount();

    // Fetch item details
    const itemsWithDetails = await Promise.all(
      shopItems.map(async (shopItem) => {
        const item = await this.itemRepo.findOne({ where: { id: shopItem.item_id } });

        const finalPrice =
          shopItem.discount_percent > 0
            ? Math.floor(shopItem.price_gold * (1 - shopItem.discount_percent / 100))
            : shopItem.price_gold;

        return {
          ...shopItem,
          item,
          final_price_gold: finalPrice,
          final_price_gems: shopItem.price_gems,
          is_limited: shopItem.stock !== -1,
        };
      }),
    );

    return {
      items: itemsWithDetails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async buyItem(userId: number, shopItemId: number, quantity: number = 1) {
    return this.dataSource.transaction(async (manager) => {
      // Get shop item
      const shopItem = await manager.findOne(ShopItem, {
        where: { id: shopItemId, available: true },
      });

      if (!shopItem) {
        throw new NotFoundException('Shop item not found or unavailable');
      }

      // Check stock
      if (shopItem.stock !== -1 && shopItem.stock < quantity) {
        throw new BadRequestException(`Insufficient stock. Available: ${shopItem.stock}`);
      }

      // Get user
      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check level requirement
      if (user.level < shopItem.min_level) {
        throw new BadRequestException(
          `Requires level ${shopItem.min_level}. You are level ${user.level}`,
        );
      }

      // Calculate total price
      const finalPriceGold =
        shopItem.discount_percent > 0
          ? Math.floor(shopItem.price_gold * (1 - shopItem.discount_percent / 100))
          : shopItem.price_gold;

      const totalGold = finalPriceGold * quantity;
      const totalGems = shopItem.price_gems * quantity;

      // Check currency
      if (user.gold < totalGold) {
        throw new BadRequestException(`Insufficient gold. Need ${totalGold}, have ${user.gold}`);
      }

      if (user.gems < totalGems) {
        throw new BadRequestException(`Insufficient gems. Need ${totalGems}, have ${user.gems}`);
      }

      // Deduct currency
      user.gold -= totalGold;
      user.gems -= totalGems;
      await manager.save(User, user);

      // Update stock
      if (shopItem.stock !== -1) {
        shopItem.stock -= quantity;
        await manager.save(ShopItem, shopItem);
      }

      // Add item to inventory
      const item = await manager.findOne(Item, { where: { id: shopItem.item_id } });
      if (!item) {
        throw new NotFoundException('Item data not found');
      }

      // Find or create inventory entry
      let invItem = await manager.findOne(UserInventory, {
        where: { user_id: userId, item_id: shopItem.item_id },
      });

      if (invItem) {
        invItem.quantity += quantity;
        await manager.save(UserInventory, invItem);
      } else {
        invItem = manager.create(UserInventory, {
          user_id: userId,
          item_id: shopItem.item_id,
          quantity,
          bound: false,
          enhance_lv: 0,
        });
        await manager.save(UserInventory, invItem);
      }

      // Track quest progress (after transaction)
      await this.questProgressService.trackBuyItem(userId, quantity);

      return {
        message: 'Purchase successful',
        item,
        quantity,
        total_cost_gold: totalGold,
        total_cost_gems: totalGems,
        gold_remaining: user.gold,
        gems_remaining: user.gems,
        inventory_item_id: invItem.id,
      };
    });
  }

  async sellItem(userId: number, inventoryItemId: number, quantity: number = 1) {
    return this.dataSource.transaction(async (manager) => {
      // Get inventory item
      const invItem = await manager.findOne(UserInventory, {
        where: { id: inventoryItemId, user_id: userId },
        relations: ['item'],
      });

      if (!invItem) {
        throw new NotFoundException('Item not found in inventory');
      }

      if (invItem.bound) {
        throw new BadRequestException('Cannot sell bound items');
      }

      if (invItem.quantity < quantity) {
        throw new BadRequestException(
          `Insufficient quantity. Have ${invItem.quantity}, trying to sell ${quantity}`,
        );
      }

      // Get item details
      const item = await manager.findOne(Item, { where: { id: invItem.item_id } });
      if (!item) {
        throw new NotFoundException('Item data not found');
      }

      // Calculate sell price (50% of base value + enhancement bonus)
      const baseValue = item.base_value || 100;
      const enhancementBonus = Math.floor(baseValue * 0.1 * (invItem.enhance_level || 0));
      const sellPrice = Math.floor((baseValue + enhancementBonus) * 0.5);
      const totalGold = sellPrice * quantity;

      // Get user
      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Add gold
      user.gold += totalGold;
      await manager.save(User, user);

      // Reduce or remove item
      if (invItem.quantity === quantity) {
        await manager.remove(UserInventory, invItem);
      } else {
        invItem.quantity -= quantity;
        await manager.save(UserInventory, invItem);
      }

      // Track quest progress (after transaction)
      await this.questProgressService.trackSellItem(userId, quantity);

      return {
        message: 'Item sold successfully',
        item,
        quantity,
        total_gold_earned: totalGold,
        gold_balance: user.gold,
        remaining_quantity: invItem.quantity > 0 ? invItem.quantity : 0,
      };
    });
  }

  async getShopCategories() {
    const categories = await this.shopItemRepo
      .createQueryBuilder('shop')
      .select('DISTINCT shop.category', 'category')
      .where('shop.available = :available', { available: true })
      .getRawMany();

    return {
      categories: categories.map((c) => c.category).filter((c) => c),
    };
  }
}
