import { Controller, Get, Query, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RateLimitGuard, RateLimit } from 'src/common/guards/rate-limit.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Battle } from 'src/entities/battle.entity';
import { PvpMatch } from 'src/entities/pvp-match.entity';

@ApiTags('history')
@Controller('history')
@UseGuards(JwtAuthGuard, RateLimitGuard)
@ApiBearerAuth()
export class HistoryController {
  constructor(
    @InjectRepository(Battle)
    private readonly battleRepo: Repository<Battle>,
    @InjectRepository(PvpMatch)
    private readonly pvpRepo: Repository<PvpMatch>,
  ) {}

  @Get('battles')
  @RateLimit({ ttl: 60, limit: 30 })
  @ApiOperation({ 
    summary: 'Lịch sử battles (dungeons)',
    description: 'Xem lịch sử các trận battle trong dungeons với pagination'
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Battle history',
    schema: {
      example: {
        battles: [
          {
            id: 123,
            user_id: 1,
            dungeon_id: 5,
            victory: true,
            turns: 8,
            loot_json: '{"gold":500,"items":[]}',
            created_at: '2025-11-04T10:30:00.000Z'
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 150,
          totalPages: 8
        }
      }
    }
  })
  async getBattleHistory(
    @Req() req: any,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    const [battles, total] = await this.battleRepo.findAndCount({
      where: { user_id: req.user.id },
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      battles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @Get('pvp')
  @RateLimit({ ttl: 60, limit: 30 })
  @ApiOperation({ 
    summary: 'Lịch sử PVP matches',
    description: 'Xem lịch sử các trận PVP với rating changes'
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'season', required: false, example: 'S1' })
  @ApiResponse({
    status: 200,
    description: 'PVP match history',
    schema: {
      example: {
        matches: [
          {
            id: 'match_abc123',
            player1_id: 1,
            player2_id: 2,
            winner_id: 1,
            player1_rating_before: 1500,
            player1_rating_after: 1516,
            player2_rating_before: 1520,
            player2_rating_after: 1504,
            season: 'S1',
            created_at: '2025-11-04T11:00:00.000Z'
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 85,
          totalPages: 5
        }
      }
    }
  })
  async getPvpHistory(
    @Req() req: any,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20,
    @Query('season') season?: string,
  ) {
    const skip = (page - 1) * limit;

    const queryBuilder = this.pvpRepo
      .createQueryBuilder('match')
      .where('match.player1_id = :userId OR match.player2_id = :userId', { userId: req.user.id })
      .orderBy('match.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    if (season) {
      queryBuilder.andWhere('match.season = :season', { season });
    }

    const [matches, total] = await queryBuilder.getManyAndCount();

    // Add perspective info (win/loss)
    const matchesWithPerspective = matches.map(match => {
      const isPlayerA = match.player_a_id === req.user.id;
      const won = (match.result === 'WIN_A' && isPlayerA) || (match.result === 'WIN_B' && !isPlayerA);
      
      return {
        ...match,
        your_rating_change: isPlayerA ? match.rating_delta_a : match.rating_delta_b,
        opponent_id: isPlayerA ? match.player_b_id : match.player_a_id,
        result: won ? 'WIN' : 'LOSS',
        rating_change: isPlayerA ? match.rating_delta_a : match.rating_delta_b,
      };
    });

    return {
      matches: matchesWithPerspective,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @Get('stats')
  @RateLimit({ ttl: 60, limit: 30 })
  @ApiOperation({ 
    summary: 'Thống kê battle tổng quan',
    description: 'Win rate, total battles, dungeons completed, PVP record'
  })
  @ApiResponse({
    status: 200,
    description: 'Battle statistics',
    schema: {
      example: {
        dungeon_stats: {
          total_battles: 150,
          victories: 140,
          win_rate: 0.933
        },
        pvp_stats: {
          total_matches: 85,
          wins: 45,
          losses: 40,
          win_rate: 0.529,
          current_rating: 1580
        }
      }
    }
  })
  async getBattleStats(@Req() req: any) {
    // Dungeon stats
    const totalBattles = await this.battleRepo.count({
      where: { user_id: req.user.id },
    });

    // Count victories by parsing result_json
    const allBattles = await this.battleRepo.find({
      where: { user_id: req.user.id },
      select: ['result_json'],
    });
    const victories = allBattles.filter(battle => {
      if (!battle.result_json) return false;
      try {
        const result = JSON.parse(battle.result_json);
        return result.victory === true;
      } catch {
        return false;
      }
    }).length;

    // PVP stats
    const totalPvp = await this.pvpRepo
      .createQueryBuilder('match')
      .where('match.player_a_id = :userId OR match.player_b_id = :userId', { userId: req.user.id })
      .getCount();

    const pvpWins = await this.pvpRepo
      .createQueryBuilder('match')
      .where('(match.player_a_id = :userId AND match.result = :winA) OR (match.player_b_id = :userId AND match.result = :winB)', 
        { userId: req.user.id, winA: 'WIN_A', winB: 'WIN_B' })
      .getCount();

    return {
      dungeon_stats: {
        total_battles: totalBattles,
        victories,
        win_rate: totalBattles > 0 ? victories / totalBattles : 0,
      },
      pvp_stats: {
        total_matches: totalPvp,
        wins: pvpWins,
        losses: totalPvp - pvpWins,
        win_rate: totalPvp > 0 ? pvpWins / totalPvp : 0,
      },
    };
  }
}
