import { Controller, Get, Post, Body, Query, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RateLimitGuard, RateLimit } from 'src/common/guards/rate-limit.guard';
import { ShopService } from './shop.service';
import { BuyItemDto, SellItemDto } from './dto/shop.dto';

@ApiTags('shop')
@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get('items')
  @ApiOperation({
    summary: 'Danh sách items trong shop',
    description: 'Xem tất cả items có thể mua với giá, discount, stock',
  })
  @ApiQuery({ name: 'category', required: false, example: 'CONSUMABLE' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiResponse({
    status: 200,
    description: 'Shop items list',
    schema: {
      example: {
        items: [
          {
            id: 1,
            item_id: 5,
            price_gold: 1000,
            price_gems: 0,
            discount_percent: 10,
            final_price_gold: 900,
            stock: 100,
            min_level: 5,
            category: 'CONSUMABLE',
            item: {
              name: 'Health Potion',
              type: 'CONSUMABLE',
              rarity: 'COMMON',
            },
          },
        ],
        pagination: {
          page: 1,
          limit: 50,
          total: 120,
          totalPages: 3,
        },
      },
    },
  })
  async listItems(
    @Query('category') category?: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 50,
  ) {
    return this.shopService.listShopItems(category, page, limit);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Danh sách categories trong shop' })
  @ApiResponse({
    status: 200,
    description: 'Available categories',
    schema: {
      example: {
        categories: ['CONSUMABLE', 'EQUIPMENT', 'MATERIAL', 'SPECIAL'],
      },
    },
  })
  async getCategories() {
    return this.shopService.getShopCategories();
  }

  @Post('buy')
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @RateLimit({ ttl: 60, limit: 30 })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mua item từ shop',
    description: 'Mua item bằng gold/gems, tự động thêm vào inventory',
  })
  @ApiResponse({
    status: 200,
    description: 'Purchase successful',
    schema: {
      example: {
        message: 'Purchase successful',
        item: { name: 'Health Potion' },
        quantity: 5,
        total_cost_gold: 4500,
        total_cost_gems: 0,
        gold_remaining: 45500,
        gems_remaining: 1000,
      },
    },
  })
  async buyItem(@Req() req: any, @Body() dto: BuyItemDto) {
    return this.shopService.buyItem(req.user.id, dto.shop_item_id, dto.quantity || 1);
  }

  @Post('sell')
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @RateLimit({ ttl: 60, limit: 30 })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Bán item từ inventory',
    description: 'Bán item để nhận gold (50% base value + enhancement bonus)',
  })
  @ApiResponse({
    status: 200,
    description: 'Item sold successfully',
    schema: {
      example: {
        message: 'Item sold successfully',
        item: { name: 'Iron Sword' },
        quantity: 1,
        total_gold_earned: 250,
        gold_balance: 50250,
        remaining_quantity: 0,
      },
    },
  })
  async sellItem(@Req() req: any, @Body() dto: SellItemDto) {
    return this.shopService.sellItem(req.user.id, dto.inventory_item_id, dto.quantity || 1);
  }
}
