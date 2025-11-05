import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyLoginReward } from 'src/entities/daily-login-reward.entity';
import { User } from 'src/entities/user.entity';
import { UserInventory } from 'src/entities/user-inventory.entity';

export interface DailyReward {
  day: number;
  gold: number;
  gems: number;
  items?: Array<{ item_id: number; quantity: number }>;
  description: string;
}

@Injectable()
export class DailyRewardsService {
  // Define reward schedule for 7-day cycle
  private readonly rewardSchedule: DailyReward[] = [
    { day: 1, gold: 500, gems: 5, description: 'Welcome back!' },
    { day: 2, gold: 750, gems: 10, description: 'Day 2 bonus' },
    {
      day: 3,
      gold: 1000,
      gems: 15,
      items: [{ item_id: 1, quantity: 3 }],
      description: 'Day 3 bonus + items',
    },
    { day: 4, gold: 1500, gems: 20, description: 'Day 4 bonus' },
    {
      day: 5,
      gold: 2000,
      gems: 25,
      items: [{ item_id: 2, quantity: 2 }],
      description: 'Day 5 bonus + items',
    },
    { day: 6, gold: 2500, gems: 30, description: 'Day 6 bonus' },
    {
      day: 7,
      gold: 5000,
      gems: 50,
      items: [{ item_id: 3, quantity: 1 }],
      description: 'Week complete! Big bonus!',
    },
  ];

  constructor(
    @InjectRepository(DailyLoginReward)
    private readonly dailyRewardRepo: Repository<DailyLoginReward>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserInventory)
    private readonly inventoryRepo: Repository<UserInventory>,
  ) {}

  /**
   * Check if user can claim daily reward
   */
  async checkDailyReward(userId: number): Promise<{
    canClaim: boolean;
    streakDay: number;
    reward?: DailyReward;
    lastLoginDate?: Date;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get last login reward
    const lastReward = await this.dailyRewardRepo.findOne({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });

    // First time login
    if (!lastReward) {
      return {
        canClaim: true,
        streakDay: 1,
        reward: this.rewardSchedule[0],
      };
    }

    const lastLoginDate = new Date(lastReward.login_date);
    lastLoginDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor(
      (today.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Already claimed today
    if (daysDiff === 0) {
      return {
        canClaim: false,
        streakDay: lastReward.streak_day,
        lastLoginDate: lastReward.login_date,
      };
    }

    // Streak continues (logged in yesterday)
    if (daysDiff === 1) {
      const nextDay = (lastReward.streak_day % 7) + 1;
      return {
        canClaim: true,
        streakDay: nextDay,
        reward: this.rewardSchedule[nextDay - 1],
      };
    }

    // Streak broken (missed a day)
    return {
      canClaim: true,
      streakDay: 1,
      reward: this.rewardSchedule[0],
    };
  }

  /**
   * Claim daily login reward
   */
  async claimDailyReward(userId: number): Promise<{
    success: boolean;
    reward: DailyReward;
    streakDay: number;
    newBalance: { gold: number; gems: number };
    message: string;
  }> {
    const check = await this.checkDailyReward(userId);

    if (!check.canClaim) {
      throw new Error('Daily reward already claimed today');
    }

    if (!check.reward) {
      throw new Error('No reward available');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const reward = check.reward;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create reward record
    const dailyReward = this.dailyRewardRepo.create({
      user_id: userId,
      login_date: today,
      streak_day: check.streakDay,
      reward_claimed: true,
      rewards: JSON.stringify(reward),
    });

    await this.dailyRewardRepo.save(dailyReward);

    // Award gold and gems
    user.gold += reward.gold;
    user.gems += reward.gems;
    await this.userRepo.save(user);

    // Award items if any
    if (reward.items && reward.items.length > 0) {
      for (const itemReward of reward.items) {
        await this.addItemToInventory(userId, itemReward.item_id, itemReward.quantity);
      }
    }

    let message = `Day ${check.streakDay} reward claimed! +${reward.gold} gold, +${reward.gems} gems`;
    if (reward.items && reward.items.length > 0) {
      message += ` + ${reward.items.length} item(s)`;
    }

    return {
      success: true,
      reward,
      streakDay: check.streakDay,
      newBalance: {
        gold: user.gold,
        gems: user.gems,
      },
      message,
    };
  }

  /**
   * Get user's login streak info
   */
  async getStreakInfo(userId: number): Promise<{
    currentStreak: number;
    totalLogins: number;
    lastLoginDate?: Date;
    nextReward?: DailyReward;
    rewardSchedule: DailyReward[];
  }> {
    const check = await this.checkDailyReward(userId);

    const totalLogins = await this.dailyRewardRepo.count({
      where: { user_id: userId },
    });

    return {
      currentStreak: check.streakDay,
      totalLogins,
      lastLoginDate: check.lastLoginDate,
      nextReward: check.canClaim ? check.reward : this.rewardSchedule[check.streakDay % 7],
      rewardSchedule: this.rewardSchedule,
    };
  }

  /**
   * Helper: Add item to inventory
   */
  private async addItemToInventory(
    userId: number,
    itemId: number,
    quantity: number,
  ): Promise<void> {
    const existing = await this.inventoryRepo.findOne({
      where: { user_id: userId, item_id: itemId },
    });

    if (existing) {
      existing.quantity += quantity;
      await this.inventoryRepo.save(existing);
    } else {
      const newItem = this.inventoryRepo.create({
        user_id: userId,
        item_id: itemId,
        quantity,
        enhance_level: 0,
        bound: false,
      });
      await this.inventoryRepo.save(newItem);
    }
  }

  /**
   * Get login history
   */
  async getLoginHistory(userId: number, limit: number = 30): Promise<DailyLoginReward[]> {
    return this.dailyRewardRepo.find({
      where: { user_id: userId },
      order: { login_date: 'DESC' },
      take: limit,
    });
  }
}
