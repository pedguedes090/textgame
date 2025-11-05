import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan, MoreThan } from 'typeorm';
import { Quest } from 'src/entities/quest.entity';
import { UserQuest } from 'src/entities/user-quest.entity';
import { User } from 'src/entities/user.entity';
import { ItemsService } from '../items/items.service';

@Injectable()
export class QuestsService {
  constructor(
    @InjectRepository(Quest)
    private readonly questRepo: Repository<Quest>,
    @InjectRepository(UserQuest)
    private readonly userQuestRepo: Repository<UserQuest>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly itemsService: ItemsService,
    private readonly dataSource: DataSource,
  ) {}

  async getUserQuests(userId: number, type?: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Auto-assign daily/weekly quests if not exists
    await this.assignDailyWeeklyQuests(userId, user.level);

    // Remove expired quests
    await this.userQuestRepo.delete({
      user_id: userId,
      expires_at: LessThan(new Date()),
      claimed: false,
    });

    const queryBuilder = this.userQuestRepo
      .createQueryBuilder('uq')
      .leftJoinAndSelect('uq.quest', 'quest')
      .where('uq.user_id = :userId', { userId })
      .andWhere('(uq.expires_at IS NULL OR uq.expires_at > :now)', { now: new Date() })
      .orderBy('uq.completed', 'ASC')
      .addOrderBy('quest.type', 'ASC');

    if (type) {
      queryBuilder.andWhere('quest.type = :type', { type });
    }

    const userQuests = await queryBuilder.getMany();

    return {
      quests: userQuests.map((uq) => ({
        ...uq,
        progress: `${uq.current_count}/${uq.quest.target_count}`,
        can_claim: uq.completed && !uq.claimed,
      })),
    };
  }

  async updateQuestProgress(userId: number, objectiveType: string, count: number = 1) {
    // Find active quests with matching objective
    const userQuests = await this.userQuestRepo
      .createQueryBuilder('uq')
      .leftJoinAndSelect('uq.quest', 'quest')
      .where('uq.user_id = :userId', { userId })
      .andWhere('quest.objective_type = :objectiveType', { objectiveType })
      .andWhere('uq.completed = :completed', { completed: false })
      .andWhere('(uq.expires_at IS NULL OR uq.expires_at > :now)', { now: new Date() })
      .getMany();

    for (const uq of userQuests) {
      uq.current_count = Math.min(uq.current_count + count, uq.quest.target_count);

      if (uq.current_count >= uq.quest.target_count) {
        uq.completed = true;
      }

      await this.userQuestRepo.save(uq);
    }
  }

  async claimQuestReward(userId: number, userQuestId: number) {
    return this.dataSource.transaction(async (manager) => {
      const userQuest = await manager.findOne(UserQuest, {
        where: { id: userQuestId, user_id: userId },
        relations: ['quest'],
      });

      if (!userQuest) {
        throw new NotFoundException('Quest not found');
      }

      if (!userQuest.completed) {
        throw new BadRequestException('Quest not completed yet');
      }

      if (userQuest.claimed) {
        throw new BadRequestException('Quest reward already claimed');
      }

      // Parse rewards
      let rewards: any = { gold: 0, gems: 0, items: [] };
      try {
        rewards = JSON.parse(userQuest.quest.rewards || '{}');
      } catch (e) {
        rewards = { gold: 0, gems: 0, items: [] };
      }

      // Get user
      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Give currency
      if (rewards.gold) {
        user.gold += rewards.gold;
      }
      if (rewards.gems) {
        user.gems += rewards.gems;
      }
      await manager.save(User, user);

      // Give items
      const itemsGiven = [];
      if (rewards.items && Array.isArray(rewards.items)) {
        for (const itemReward of rewards.items) {
          await this.itemsService.addItemToInventory(
            userId,
            itemReward.item_id,
            itemReward.quantity || 1,
            false,
          );
          itemsGiven.push(itemReward);
        }
      }

      // Mark as claimed
      userQuest.claimed = true;
      await manager.save(UserQuest, userQuest);

      return {
        message: 'Quest reward claimed successfully',
        quest_name: userQuest.quest.name,
        rewards: {
          gold: rewards.gold || 0,
          gems: rewards.gems || 0,
          items: itemsGiven,
        },
        gold_balance: user.gold,
        gems_balance: user.gems,
      };
    });
  }

  private async assignDailyWeeklyQuests(userId: number, userLevel: number) {
    const now = new Date();

    // Daily quests expire in 24 hours
    const dailyExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Weekly quests expire in 7 days
    const weeklyExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get daily quests not yet assigned
    const dailyQuests = await this.questRepo.find({
      where: {
        type: 'DAILY',
        active: true,
      },
    });

    for (const quest of dailyQuests) {
      if (quest.min_level > userLevel) continue;

      const existing = await this.userQuestRepo.findOne({
        where: {
          user_id: userId,
          quest_id: quest.id,
          expires_at: MoreThan(now),
        },
      });

      if (!existing) {
        await this.userQuestRepo.save({
          user_id: userId,
          quest_id: quest.id,
          current_count: 0,
          completed: false,
          claimed: false,
          expires_at: dailyExpiry,
        });
      }
    }

    // Same for weekly quests
    const weeklyQuests = await this.questRepo.find({
      where: {
        type: 'WEEKLY',
        active: true,
      },
    });

    for (const quest of weeklyQuests) {
      if (quest.min_level > userLevel) continue;

      const existing = await this.userQuestRepo.findOne({
        where: {
          user_id: userId,
          quest_id: quest.id,
          expires_at: MoreThan(now),
        },
      });

      if (!existing) {
        await this.userQuestRepo.save({
          user_id: userId,
          quest_id: quest.id,
          current_count: 0,
          completed: false,
          claimed: false,
          expires_at: weeklyExpiry,
        });
      }
    }
  }

  async getAvailableQuests(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const quests = await this.questRepo.find({
      where: {
        active: true,
      },
      order: {
        type: 'ASC',
        min_level: 'ASC',
      },
    });

    return {
      quests: quests.filter((q) => q.min_level <= user.level),
    };
  }
}
