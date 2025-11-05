import {
  Controller,
  Post,
  Get,
  UseGuards,
  Body,
  Req,
  Query,
  BadRequestException,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RateLimitGuard, RateLimit } from 'src/common/guards/rate-limit.guard';
import { EnhanceItemDto, EquipItemDto, UnequipItemDto } from './dto/enhance-item.dto';
import { ItemsService } from './items.service';

@ApiTags('items')
@Controller('item')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post('enhance')
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @RateLimit({ ttl: 60, limit: 30 })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cường hoá vật phẩm +0 -> +15',
    description: 'Enhancement với success rate curve, cost scaling (base * 1.5^level)',
  })
  @ApiResponse({
    status: 200,
    description: 'Kết quả enhancement',
    schema: {
      example: {
        success: true,
        new_level: 6,
        cost: 759,
        success_rate: 0.9,
        gold_remaining: 1500,
      },
    },
  })
  async enhanceItem(@Req() req: any, @Body() dto: EnhanceItemDto) {
    return this.itemsService.enhanceItem(req.user.id, dto.item_id);
  }

  @Get('inventory')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lấy danh sách inventory',
    description: 'Xem tất cả items trong túi với pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Inventory list với pagination',
    schema: {
      example: {
        items: [
          {
            id: 1,
            item_id: 5,
            quantity: 10,
            enhance_lv: 3,
            bound: false,
            item: {
              name: 'Iron Sword',
              rarity: 'RARE',
              type: 'WEAPON',
            },
          },
        ],
        pagination: {
          page: 1,
          pageSize: 50,
          total: 150,
          totalPages: 3,
        },
      },
    },
  })
  async getInventory(@Req() req: any, @Query('page') page: number = 1) {
    return this.itemsService.getInventory(req.user.id, page);
  }

  @Post('equip')
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @RateLimit({ ttl: 60, limit: 30 })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Trang bị item cho creature',
    description: 'Equip weapon/armor/charm/ring vào creature',
  })
  @ApiResponse({ status: 200, description: 'Item equipped successfully' })
  async equipItem(@Req() req: any, @Body() dto: EquipItemDto) {
    return this.itemsService.equipItem(req.user.id, dto.creature_id, dto.inventory_item_id);
  }

  @Post('unequip')
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @RateLimit({ ttl: 60, limit: 30 })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Gỡ item khỏi creature',
    description: 'Unequip item từ slot cụ thể',
  })
  @ApiResponse({ status: 200, description: 'Item unequipped successfully' })
  async unequipItem(@Req() req: any, @Body() dto: UnequipItemDto) {
    return this.itemsService.unequipItem(req.user.id, dto.creature_id, dto.slot);
  }

  @Get('equipped/:creatureId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Xem items đang trang bị trên creature',
    description: 'Lấy tất cả equipped items của 1 creature',
  })
  @ApiParam({ name: 'creatureId', description: 'Creature ID' })
  @ApiResponse({ status: 200, description: 'Equipped items details' })
  async getEquippedItems(@Req() req: any, @Param('creatureId', ParseIntPipe) creatureId: number) {
    return this.itemsService.getEquippedItems(req.user.id, creatureId);
  }
}
