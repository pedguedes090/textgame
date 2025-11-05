import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RateLimitGuard, RateLimit } from 'src/common/guards/rate-limit.guard';
import { DungeonsService } from './dungeons.service';
import { RunDungeonDto } from './dto/run-dungeon.dto';

@ApiTags('dungeons')
@Controller('dungeon')
export class DungeonsController {
  constructor(private readonly dungeonsService: DungeonsService) {}

  @Get('list')
  @ApiOperation({ summary: 'Lấy danh sách phó bản' })
  @ApiResponse({ status: 200, description: 'Danh sách dungeons' })
  async listDungeons() {
    return this.dungeonsService.listDungeons();
  }

  @Get(':id/drops')
  @ApiOperation({
    summary: 'Xem drop rates của dungeon',
    description: 'Transparent odds - xem % drop của tất cả items trong dungeon',
  })
  @ApiParam({ name: 'id', description: 'Dungeon ID' })
  @ApiResponse({
    status: 200,
    description: 'Drop tables with rates',
    schema: {
      example: {
        dungeon_id: 1,
        dungeon_name: 'Forest Ruins',
        drop_tables: [
          {
            item: { name: 'Iron Sword', rarity: 'RARE' },
            drop_rate: 0.15,
            min_quantity: 1,
            max_quantity: 1,
          },
          {
            item: { name: 'Health Potion', rarity: 'COMMON' },
            drop_rate: 0.5,
            min_quantity: 1,
            max_quantity: 3,
          },
        ],
        guaranteed_gold: { min: 500, max: 1000 },
      },
    },
  })
  async getDungeonDrops(@Param('id', ParseIntPipe) dungeonId: number) {
    return this.dungeonsService.getDungeonDropRates(dungeonId);
  }

  @Post('run')
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @RateLimit({ ttl: 60, limit: 30 })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Chạy phó bản (auto-resolve)' })
  @ApiResponse({ status: 200, description: 'Kết quả trận đấu & loot' })
  @ApiResponse({ status: 400, description: 'Thiếu stamina hoặc party không hợp lệ' })
  async runDungeon(@Req() req: any, @Body() dto: RunDungeonDto) {
    return this.dungeonsService.runDungeon(req.user.id, dto);
  }
}
