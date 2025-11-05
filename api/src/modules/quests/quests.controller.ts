import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RateLimitGuard, RateLimit } from 'src/common/guards/rate-limit.guard';
import { QuestsService } from './quests.service';
import { ClaimQuestDto } from './dto/quest.dto';

@ApiTags('quests')
@Controller('quests')
@UseGuards(JwtAuthGuard, RateLimitGuard)
@ApiBearerAuth()
export class QuestsController {
  constructor(private readonly questsService: QuestsService) {}

  @Get()
  @RateLimit({ ttl: 60, limit: 30 })
  @ApiOperation({
    summary: 'Lấy danh sách quests của user',
    description: 'Xem daily/weekly/story quests với progress tracking',
  })
  @ApiQuery({ name: 'type', required: false, example: 'DAILY' })
  @ApiResponse({
    status: 200,
    description: 'User quests',
    schema: {
      example: {
        quests: [
          {
            id: 1,
            quest: {
              name: 'Daily Hunt',
              description: 'Hunt 5 creatures',
              type: 'DAILY',
              objective_type: 'HUNT',
              target_count: 5,
              rewards: '{"gold":500,"gems":10}',
            },
            current_count: 3,
            completed: false,
            claimed: false,
            progress: '3/5',
            can_claim: false,
            expires_at: '2025-11-05T12:00:00.000Z',
          },
        ],
      },
    },
  })
  async getUserQuests(@Req() req: any, @Query('type') type?: string) {
    return this.questsService.getUserQuests(req.user.id, type);
  }

  @Get('available')
  @RateLimit({ ttl: 60, limit: 30 })
  @ApiOperation({
    summary: 'Lấy danh sách quests có thể nhận',
    description: 'Tất cả quests active và đủ level requirement',
  })
  @ApiResponse({ status: 200, description: 'Available quests' })
  async getAvailableQuests(@Req() req: any) {
    return this.questsService.getAvailableQuests(req.user.id);
  }

  @Post('claim')
  @RateLimit({ ttl: 60, limit: 30 })
  @ApiOperation({
    summary: 'Claim quest reward',
    description: 'Nhận reward khi hoàn thành quest (gold, gems, items)',
  })
  @ApiResponse({
    status: 200,
    description: 'Reward claimed',
    schema: {
      example: {
        message: 'Quest reward claimed successfully',
        quest_name: 'Daily Hunt',
        rewards: {
          gold: 500,
          gems: 10,
          items: [],
        },
        gold_balance: 50500,
        gems_balance: 1010,
      },
    },
  })
  async claimReward(@Req() req: any, @Body() dto: ClaimQuestDto) {
    return this.questsService.claimQuestReward(req.user.id, dto.user_quest_id);
  }
}
