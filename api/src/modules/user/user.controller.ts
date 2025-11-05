import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  Req,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RateLimitGuard, RateLimit } from 'src/common/guards/rate-limit.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { gameConfig } from 'src/config/game.config';
import { DailyRewardsService } from 'src/common/services/daily-rewards.service';
import { UpdateProfileDto, ChangePasswordDto } from './dto/user.dto';
import * as argon2 from 'argon2';

@ApiTags('user')
@Controller('user')
@UseGuards(JwtAuthGuard, RateLimitGuard)
@ApiBearerAuth()
export class UserController {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dailyRewardsService: DailyRewardsService,
  ) {}

  @Get('stamina')
  @RateLimit({ ttl: 60, limit: 60 })
  @ApiOperation({
    summary: 'Xem stamina hiện tại',
    description: 'Lấy thông tin stamina hiện tại và thời gian regen tiếp theo',
  })
  @ApiResponse({
    status: 200,
    description: 'Stamina information',
    schema: {
      example: {
        current_stamina: 75,
        max_stamina: 100,
        regen_rate: 1,
        regen_interval_ms: 300000,
        regen_interval_minutes: 5,
        last_regen: '2025-11-04T12:00:00.000Z',
        next_regen: '2025-11-04T12:05:00.000Z',
        time_to_next_regen_seconds: 180,
      },
    },
  })
  async getStamina(@Req() req: any) {
    const user = await this.userRepo.findOne({
      where: { id: req.user.id },
      select: ['id', 'stamina', 'stamina_updated_at'],
    });

    if (!user) {
      return { error: 'User not found' };
    }

    const maxStamina = gameConfig.stamina.max;
    const regenInterval = gameConfig.stamina.regenInterval;
    const regenAmount = gameConfig.stamina.regenAmount;

    const lastRegen = new Date(Number(user.stamina_updated_at));
    const now = new Date();
    const nextRegen = new Date(lastRegen.getTime() + regenInterval);
    const timeToNextRegenSeconds = Math.max(
      0,
      Math.floor((nextRegen.getTime() - now.getTime()) / 1000),
    );

    return {
      current_stamina: user.stamina,
      max_stamina: maxStamina,
      regen_rate: regenAmount,
      regen_interval_ms: regenInterval,
      regen_interval_minutes: regenInterval / 60000,
      last_regen: lastRegen.toISOString(),
      next_regen: nextRegen.toISOString(),
      time_to_next_regen_seconds: timeToNextRegenSeconds,
    };
  }

  @Get('stats')
  @RateLimit({ ttl: 60, limit: 30 })
  @ApiOperation({
    summary: 'Xem stats tổng quan của user',
    description: 'Level, XP, gold, gems, stamina, số creatures, v.v.',
  })
  @ApiResponse({
    status: 200,
    description: 'User statistics',
    schema: {
      example: {
        id: 1,
        username: 'player1',
        level: 25,
        exp: 15000,
        exp_to_next_level: 20000,
        gold: 50000,
        gems: 1500,
        stamina: 75,
        total_creatures: 42,
        total_battles: 150,
      },
    },
  })
  async getUserStats(@Req() req: any) {
    const user = await this.userRepo.findOne({
      where: { id: req.user.id },
    });

    if (!user) {
      return { error: 'User not found' };
    }

    const expToNextLevel = gameConfig.xp.formula(user.level);

    return {
      id: user.id,
      username: user.username,
      level: user.level,
      exp: user.exp,
      exp_to_next_level: expToNextLevel,
      gold: user.gold,
      gems: user.gems,
      stamina: user.stamina,
      created_at: user.created_at,
    };
  }

  @Put('profile')
  @RateLimit({ ttl: 60, limit: 10 })
  @ApiOperation({
    summary: 'Cập nhật profile',
    description: 'Update bio, avatar',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated',
    schema: {
      example: {
        message: 'Profile updated successfully',
        profile: {
          bio: 'My cool bio',
          avatar: 'avatar_url.png',
        },
      },
    },
  })
  async updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    const user = await this.userRepo.findOne({ where: { id: req.user.id } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Parse current profile
    let profile: any = {};
    try {
      profile = user.profile_json ? JSON.parse(user.profile_json) : {};
    } catch (e) {
      profile = {};
    }

    // Update fields
    if (dto.bio !== undefined) {
      profile.bio = dto.bio;
    }
    if (dto.avatar !== undefined) {
      profile.avatar = dto.avatar;
    }

    user.profile_json = JSON.stringify(profile);
    await this.userRepo.save(user);

    return {
      message: 'Profile updated successfully',
      profile,
    };
  }

  @Post('change-password')
  @RateLimit({ ttl: 60, limit: 5 })
  @ApiOperation({
    summary: 'Đổi mật khẩu',
    description: 'Change password with old password verification',
  })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  async changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    const user = await this.userRepo.findOne({
      where: { id: req.user.id },
      select: ['id', 'pass_hash'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Verify old password
    const validPassword = await argon2.verify(user.pass_hash, dto.old_password);
    if (!validPassword) {
      throw new UnauthorizedException('Old password is incorrect');
    }

    // Hash new password
    const newPassHash = await argon2.hash(dto.new_password);
    user.pass_hash = newPassHash;
    await this.userRepo.save(user);

    return {
      message: 'Password changed successfully',
    };
  }

  @Get('profile')
  @RateLimit({ ttl: 60, limit: 30 })
  @ApiOperation({
    summary: 'Xem profile đầy đủ',
    description: 'Full user profile with bio, avatar, stats',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile',
    schema: {
      example: {
        id: 1,
        username: 'player1',
        level: 25,
        exp: 15000,
        gold: 50000,
        gems: 1500,
        stamina: 75,
        bio: 'My cool bio',
        avatar: 'avatar_url.png',
        created_at: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  async getFullProfile(@Req() req: any) {
    const user = await this.userRepo.findOne({ where: { id: req.user.id } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    let profile: any = {};
    try {
      profile = user.profile_json ? JSON.parse(user.profile_json) : {};
    } catch (e) {
      profile = {};
    }

    return {
      id: user.id,
      username: user.username,
      level: user.level,
      exp: user.exp,
      gold: user.gold,
      gems: user.gems,
      stamina: user.stamina,
      bio: profile.bio || '',
      avatar: profile.avatar || '',
      created_at: user.created_at,
    };
  }

  @Get('daily-reward/check')
  @RateLimit({ ttl: 60, limit: 30 })
  @ApiOperation({
    summary: 'Kiểm tra daily login reward',
    description: 'Check nếu có thể claim daily reward và xem streak hiện tại',
  })
  @ApiResponse({
    status: 200,
    description: 'Daily reward status',
    schema: {
      example: {
        canClaim: true,
        streakDay: 3,
        reward: {
          day: 3,
          gold: 1000,
          gems: 15,
          items: [{ item_id: 1, quantity: 3 }],
          description: 'Day 3 bonus + items',
        },
        rewardSchedule: [],
      },
    },
  })
  async checkDailyReward(@Req() req: any) {
    const check = await this.dailyRewardsService.checkDailyReward(req.user.id);
    const streakInfo = await this.dailyRewardsService.getStreakInfo(req.user.id);

    return {
      ...check,
      rewardSchedule: streakInfo.rewardSchedule,
    };
  }

  @Post('daily-reward/claim')
  @RateLimit({ ttl: 60, limit: 10 })
  @ApiOperation({
    summary: 'Claim daily login reward',
    description: 'Nhận reward hàng ngày khi đăng nhập',
  })
  @ApiResponse({
    status: 200,
    description: 'Reward claimed successfully',
    schema: {
      example: {
        success: true,
        reward: {
          day: 3,
          gold: 1000,
          gems: 15,
          items: [{ item_id: 1, quantity: 3 }],
          description: 'Day 3 bonus + items',
        },
        streakDay: 3,
        newBalance: {
          gold: 51000,
          gems: 1515,
        },
        message: 'Day 3 reward claimed! +1000 gold, +15 gems + 1 item(s)',
      },
    },
  })
  async claimDailyReward(@Req() req: any) {
    return this.dailyRewardsService.claimDailyReward(req.user.id);
  }

  @Get('daily-reward/streak')
  @RateLimit({ ttl: 60, limit: 30 })
  @ApiOperation({
    summary: 'Xem login streak info',
    description: 'Xem thông tin streak và lịch sử login',
  })
  @ApiResponse({
    status: 200,
    description: 'Streak information',
    schema: {
      example: {
        currentStreak: 3,
        totalLogins: 15,
        lastLoginDate: '2025-11-04',
        nextReward: {
          day: 4,
          gold: 1500,
          gems: 20,
          description: 'Day 4 bonus',
        },
        rewardSchedule: [],
      },
    },
  })
  async getStreakInfo(@Req() req: any) {
    return this.dailyRewardsService.getStreakInfo(req.user.id);
  }

  @Get('daily-reward/history')
  @RateLimit({ ttl: 60, limit: 30 })
  @ApiOperation({
    summary: 'Xem lịch sử login rewards',
    description: 'Lịch sử 30 ngày gần nhất',
  })
  @ApiResponse({
    status: 200,
    description: 'Login history',
  })
  async getLoginHistory(@Req() req: any) {
    const history = await this.dailyRewardsService.getLoginHistory(req.user.id, 30);
    return { history };
  }
}
