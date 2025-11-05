import { Controller, Get, Post, UseGuards, Body, Req, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RateLimitGuard, RateLimit } from 'src/common/guards/rate-limit.guard';
import { PvpService } from 'src/common/services/pvp.service';
import { QuestProgressService } from 'src/common/services/quest-progress.service';
import { StaminaService } from 'src/common/services/stamina.service';
import { QueuePvpDto, SubmitPvpResultDto } from './dto/pvp.dto';

@ApiTags('pvp')
@Controller('pvp')
export class PvpController {
  constructor(
    private readonly pvpService: PvpService,
    private readonly questProgressService: QuestProgressService,
    private readonly staminaService: StaminaService,
  ) {}

  @Get('queue')
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @RateLimit({ ttl: 60, limit: 10 })
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Join PVP queue',
    description: 'Tìm đối thủ trong queue với matchmaking ±200 rating'
  })
  @ApiQuery({ name: 'season', required: false, example: 'S1' })
  @ApiResponse({
    status: 200,
    description: 'Matchmaking result',
    schema: {
      example: {
        status: 'matched',
        opponent_id: 1234,
        match_id: 'match_abc123',
        your_rating: 1500,
        opponent_rating: 1520
      }
    }
  })
  async queue(@Req() req: any, @Query('season') season?: string) {
    const userId = req.user.id;
    
    // Mock queue implementation
    const opponentId = await this.pvpService.findOpponent(userId, 1500 + Math.floor(Math.random() * 100));
    
    if (opponentId) {
      return {
        status: 'matched',
        opponent_id: opponentId,
        match_id: `match_${Date.now()}`,
        your_rating: 1500,
        opponent_rating: 1520,
      };
    }
    
    return {
      status: 'queued',
      message: 'Waiting for opponent...',
      queue_position: Math.floor(Math.random() * 10) + 1,
    };
  }

  @Post('result')
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @RateLimit({ ttl: 60, limit: 10 })
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Submit PVP result & update Elo',
    description: 'Cập nhật rating sau match với Elo algorithm (K-factor 32)'
  })
  @ApiResponse({
    status: 200,
    description: 'Elo update result',
    schema: {
      example: {
        result: 'WIN_A',
        player_a: {
          id: 1,
          old_rating: 1500,
          new_rating: 1516,
          delta: 16
        },
        player_b: {
          id: 2,
          old_rating: 1520,
          new_rating: 1504,
          delta: -16
        }
      }
    }
  })
  async submitResult(@Req() req: any, @Body() dto: SubmitPvpResultDto) {
    const userId = req.user.id;
    const PVP_STAMINA_COST = 5; // PVP costs less stamina than hunts/dungeons
    
    // Deduct stamina
    await this.staminaService.deductStamina(userId, PVP_STAMINA_COST);
    
    // Mock: Assume match exists với player A = req.user.id, player B = random
    const playerA = userId;
    const playerB = playerA + 1000; // Mock opponent
    
    const ratingA = 1500;
    const ratingB = 1520;
    
    // Map result format
    const eloResult = dto.result === 'A' 
      ? this.pvpService.calculateElo(ratingA, ratingB, 'WIN_A')
      : dto.result === 'B'
      ? this.pvpService.calculateElo(ratingA, ratingB, 'WIN_B')
      : this.pvpService.calculateElo(ratingA, ratingB, 'DRAW');
    
    // Track quest progress
    const won = dto.result === 'A';
    await this.questProgressService.trackPvpMatch(userId, won);
    
    return {
      result: dto.result,
      stamina_cost: PVP_STAMINA_COST,
      player_a: {
        id: playerA,
        old_rating: ratingA,
        new_rating: eloResult.playerA.newRating,
        delta: eloResult.playerA.delta,
      },
      player_b: {
        id: playerB,
        old_rating: ratingB,
        new_rating: eloResult.playerB.newRating,
        delta: eloResult.playerB.delta,
      },
      proof: dto.proof,
    };
  }
}
