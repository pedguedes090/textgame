import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { UserInventory } from 'src/entities/user-inventory.entity';
import { Item } from 'src/entities/item.entity';
import { UserCreature } from 'src/entities/user-creature.entity';
import { gameConfig } from 'src/config/game.config';
import { LockService } from 'src/common/services/lock.service';
import { CreatureProgressionService } from 'src/common/services/creature-progression.service';
import { QuestProgressService } from 'src/common/services/quest-progress.service';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserInventory)
    private readonly inventoryRepo: Repository<UserInventory>,
    @InjectRepository(Item)
    private readonly itemRepo: Repository<Item>,
    @InjectRepository(UserCreature)
    private readonly creatureRepo: Repository<UserCreature>,
    private readonly lockService: LockService,
    private readonly creatureProgressionService: CreatureProgressionService,
    private readonly questProgressService: QuestProgressService,
    private readonly dataSource: DataSource,
  ) {}

  async enhanceItem(userId: number, inventoryItemId: number) {
    const lockKey = `enhance:${userId}:${inventoryItemId}`;
    
    return this.lockService.withLock(lockKey, 5000, async () => {
      return this.dataSource.transaction(async (manager) => {
        // Get user
        const user = await manager.findOne(User, { where: { id: userId } });
        if (!user) {
          throw new NotFoundException('User not found');
        }

        // Get inventory item
        const invItem = await manager.findOne(UserInventory, {
          where: { id: inventoryItemId, user_id: userId },
          relations: ['item'],
        });

        if (!invItem) {
          throw new NotFoundException('Item not found in inventory');
        }

        const currentLevel = invItem.enhance_level || 0;
        const maxLevel = gameConfig.enhance.maxLevel;

        if (currentLevel >= maxLevel) {
          throw new BadRequestException('Item already at max enhancement level');
        }

        // Calculate cost
        const cost = Math.floor(
          gameConfig.enhance.baseCost * Math.pow(gameConfig.enhance.costMultiplier, currentLevel)
        );

        // Check gold
        if (user.gold < cost) {
          throw new BadRequestException(
            `Insufficient gold. Need ${cost}, have ${user.gold}`
          );
        }

        // Deduct gold
        user.gold -= cost;
        await manager.save(User, user);

        // Roll success
        const successRate = gameConfig.enhance.successRate[currentLevel] || 0;
        const success = Math.random() < successRate;

        let newLevel = currentLevel;
        if (success) {
          newLevel = currentLevel + 1;
          invItem.enhance_level = newLevel;
          await manager.save(UserInventory, invItem);
        }

        // Track quest progress after successful enhancement
        if (success) {
          await this.questProgressService.trackEnhanceItem(userId);
        }

        return {
          success,
          old_level: currentLevel,
          new_level: newLevel,
          cost,
          success_rate: successRate,
          gold_remaining: user.gold,
          message: success ? 'Enhancement successful!' : 'Enhancement failed',
        };
      });
    });
  }

  /**
   * Add item to inventory
   */
  async addItemToInventory(
    userId: number,
    itemId: number,
    quantity: number = 1,
    bound: boolean = false,
  ): Promise<UserInventory> {
    return this.dataSource.transaction(async (manager) => {
      // Check if item exists
      const item = await manager.findOne(Item, { where: { id: itemId } });
      if (!item) {
        throw new NotFoundException(`Item ${itemId} not found`);
      }

      // Find existing stackable item
      const existing = await manager.findOne(UserInventory, {
        where: { user_id: userId, item_id: itemId, bound },
      });

      if (existing) {
        existing.quantity += quantity;
        return manager.save(UserInventory, existing);
      }

      // Create new
      const invItem = manager.create(UserInventory, {
        user_id: userId,
        item_id: itemId,
        quantity,
        bound,
        enhance_level: 0,
      });

      return manager.save(UserInventory, invItem);
    });
  }

  /**
   * Add gold/gems to user
   */
  async addCurrency(
    userId: number,
    gold: number = 0,
    gems: number = 0,
  ): Promise<User> {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      user.gold += gold;
      user.gems += gems;

      return manager.save(User, user);
    });
  }

  /**
   * Deduct gems (for gacha, etc)
   */
  async deductGems(userId: number, amount: number): Promise<User> {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.gems < amount) {
        throw new BadRequestException(
          `Insufficient gems. Need ${amount}, have ${user.gems}`
        );
      }

      user.gems -= amount;
      return manager.save(User, user);
    });
  }

  /**
   * Get user inventory with pagination
   */
  async getInventory(userId: number, page: number = 1) {
    const pageSize = 50;
    const skip = (page - 1) * pageSize;

    const [items, total] = await this.inventoryRepo.findAndCount({
      where: { user_id: userId },
      relations: ['item'],
      order: { id: 'ASC' },
      skip,
      take: pageSize,
    });

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Equip item to creature
   */
  async equipItem(userId: number, creatureId: number, inventoryItemId: number) {
    const result = await this.dataSource.transaction(async (manager) => {
      // Get creature
      const creature = await manager.findOne(UserCreature, {
        where: { id: creatureId, user_id: userId },
      });

      if (!creature) {
        throw new NotFoundException('Creature not found');
      }

      // Get inventory item
      const invItem = await manager.findOne(UserInventory, {
        where: { id: inventoryItemId, user_id: userId },
        relations: ['item'],
      });

      if (!invItem) {
        throw new NotFoundException('Item not found in inventory');
      }

      const item = invItem.item;

      // Check if item is equipment type
      const equipmentTypes = ['WEAPON', 'ARMOR', 'CHARM', 'RING'];
      if (!equipmentTypes.includes(item.type)) {
        throw new BadRequestException('Item is not equippable');
      }

      // Parse current gear
      let gearSlots: Record<string, number> = {};
      try {
        gearSlots = creature.gear_slots ? JSON.parse(creature.gear_slots) : {};
      } catch (e) {
        gearSlots = {};
      }

      // Determine slot
      const slotMap: Record<string, string> = {
        WEAPON: 'weapon_id',
        ARMOR: 'armor_id',
        CHARM: 'charm_id',
        RING: 'ring_id',
      };

      const slotKey = slotMap[item.type];
      if (!slotKey) {
        throw new BadRequestException('Invalid item type');
      }

      // Check if slot already occupied
      const previousItemId = gearSlots[slotKey];

      // Equip new item
      gearSlots[slotKey] = inventoryItemId;
      creature.gear_slots = JSON.stringify(gearSlots);

      await manager.save(UserCreature, creature);

      return {
        message: 'Item equipped successfully',
        creature_id: creatureId,
        slot: slotKey,
        equipped_item_id: inventoryItemId,
        previous_item_id: previousItemId || null,
        gear_slots: gearSlots,
      };
    });

    // Recalculate power score after transaction completes
    try {
      const updatedCreature = await this.creatureRepo.findOne({
        where: { id: creatureId, user_id: userId },
      });
      if (updatedCreature) {
        const newStats = await this.creatureProgressionService.calculateCreatureStats(updatedCreature);
        updatedCreature.power_score = this.creatureProgressionService.calculatePowerScore(newStats);
        await this.creatureRepo.save(updatedCreature);
      }
    } catch (error) {
      console.error('Error recalculating power score:', error);
    }

    return result;
  }

  /**
   * Unequip item from creature
   */
  async unequipItem(userId: number, creatureId: number, slot: string) {
    const result = await this.dataSource.transaction(async (manager) => {
      // Get creature
      const creature = await manager.findOne(UserCreature, {
        where: { id: creatureId, user_id: userId },
      });

      if (!creature) {
        throw new NotFoundException('Creature not found');
      }

      // Parse gear slots
      let gearSlots: Record<string, number> = {};
      try {
        gearSlots = creature.gear_slots ? JSON.parse(creature.gear_slots) : {};
      } catch (e) {
        gearSlots = {};
      }

      // Validate slot
      const validSlots = ['weapon_id', 'armor_id', 'charm_id', 'ring_id'];
      if (!validSlots.includes(slot)) {
        throw new BadRequestException('Invalid slot');
      }

      if (!gearSlots[slot]) {
        throw new BadRequestException('No item equipped in this slot');
      }

      const unequippedItemId = gearSlots[slot];
      delete gearSlots[slot];

      creature.gear_slots = JSON.stringify(gearSlots);

      await manager.save(UserCreature, creature);

      return {
        message: 'Item unequipped successfully',
        creature_id: creatureId,
        slot,
        unequipped_item_id: unequippedItemId,
        gear_slots: gearSlots,
      };
    });

    // Recalculate power score after transaction completes
    try {
      const updatedCreature = await this.creatureRepo.findOne({
        where: { id: creatureId, user_id: userId },
      });
      if (updatedCreature) {
        const newStats = await this.creatureProgressionService.calculateCreatureStats(updatedCreature);
        updatedCreature.power_score = this.creatureProgressionService.calculatePowerScore(newStats);
        await this.creatureRepo.save(updatedCreature);
      }
    } catch (error) {
      console.error('Error recalculating power score:', error);
    }

    return result;
  }

  /**
   * Get equipped items for a creature
   */
  async getEquippedItems(userId: number, creatureId: number) {
    const creature = await this.creatureRepo.findOne({
      where: { id: creatureId, user_id: userId },
    });

    if (!creature) {
      throw new NotFoundException('Creature not found');
    }

    let gearSlots = {};
    try {
      gearSlots = creature.gear_slots ? JSON.parse(creature.gear_slots) : {};
    } catch (e) {
      gearSlots = {};
    }

    // Fetch item details
    const equippedItems: any = {};
    for (const [slot, invItemId] of Object.entries(gearSlots)) {
      if (invItemId) {
        const invItem = await this.inventoryRepo.findOne({
          where: { id: invItemId as number, user_id: userId },
          relations: ['item'],
        });

        if (invItem) {
          equippedItems[slot] = {
            inventory_item_id: invItem.id,
            item: invItem.item,
            enhance_level: invItem.enhance_level,
          };
        }
      }
    }

    return {
      creature_id: creatureId,
      equipped_items: equippedItems,
    };
  }
}
