import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserQuest } from 'src/entities/user-quest.entity';
import { Quest } from 'src/entities/quest.entity';

export enum QuestObjectiveType {
  HUNT = 'HUNT',
  DUNGEON = 'DUNGEON',
  PVP_WIN = 'PVP_WIN',
  PVP_MATCH = 'PVP_MATCH',
  BUY_ITEM = 'BUY_ITEM',
  SELL_ITEM = 'SELL_ITEM',
  ENHANCE_ITEM = 'ENHANCE_ITEM',
  LEVEL_UP_CREATURE = 'LEVEL_UP_CREATURE',
  COLLECT_GOLD = 'COLLECT_GOLD',
  COLLECT_CREATURE = 'COLLECT_CREATURE',
}

@Injectable()
export class QuestProgressService {
  constructor(
    @InjectRepository(UserQuest)
    private readonly userQuestRepo: Repository<UserQuest>,
    @InjectRepository(Quest)
    private readonly questRepo: Repository<Quest>,
  ) {}

  /**
   * Track progress cho một objective type cụ thể
   */
  async trackProgress(
    userId: number,
    objectiveType: QuestObjectiveType,
    amount: number = 1,
    metadata?: any,
  ): Promise<void> {
    try {
      // Tìm tất cả active quests của user với objective type này
      const userQuests = await this.userQuestRepo
        .createQueryBuilder('uq')
        .leftJoinAndSelect('uq.quest', 'q')
        .where('uq.user_id = :userId', { userId })
        .andWhere('uq.completed = false')
        .andWhere('q.objective_type = :objectiveType', { objectiveType })
        .andWhere('q.is_active = true')
        .getMany();

      // Update progress cho mỗi quest
      for (const userQuest of userQuests) {
        // Nếu đã completed hoặc claimed thì skip
        if (userQuest.completed || userQuest.claimed) continue;

        // Check expiration (nếu có)
        if (userQuest.expires_at && new Date() > userQuest.expires_at) {
          continue;
        }

        // Tăng progress
        const newCount = userQuest.current_count + amount;
        const targetCount = userQuest.quest.target_count;

        userQuest.current_count = Math.min(newCount, targetCount);

        // Check completion
        if (userQuest.current_count >= targetCount) {
          userQuest.completed = true;
        }

        await this.userQuestRepo.save(userQuest);
      }
    } catch (error) {
      console.error(`Error tracking quest progress for ${objectiveType}:`, error);
      // Không throw error để không block main flow
    }
  }

  /**
   * Track hunt activity
   */
  async trackHunt(userId: number): Promise<void> {
    await this.trackProgress(userId, QuestObjectiveType.HUNT, 1);
  }

  /**
   * Track dungeon clear
   */
  async trackDungeon(userId: number, dungeonId?: number): Promise<void> {
    await this.trackProgress(userId, QuestObjectiveType.DUNGEON, 1, { dungeonId });
  }

  /**
   * Track PVP match
   */
  async trackPvpMatch(userId: number, won: boolean): Promise<void> {
    await this.trackProgress(userId, QuestObjectiveType.PVP_MATCH, 1);
    if (won) {
      await this.trackProgress(userId, QuestObjectiveType.PVP_WIN, 1);
    }
  }

  /**
   * Track shop purchase
   */
  async trackBuyItem(userId: number, quantity: number = 1): Promise<void> {
    await this.trackProgress(userId, QuestObjectiveType.BUY_ITEM, quantity);
  }

  /**
   * Track shop sell
   */
  async trackSellItem(userId: number, quantity: number = 1): Promise<void> {
    await this.trackProgress(userId, QuestObjectiveType.SELL_ITEM, quantity);
  }

  /**
   * Track item enhancement
   */
  async trackEnhanceItem(userId: number): Promise<void> {
    await this.trackProgress(userId, QuestObjectiveType.ENHANCE_ITEM, 1);
  }

  /**
   * Track creature level up
   */
  async trackLevelUpCreature(userId: number): Promise<void> {
    await this.trackProgress(userId, QuestObjectiveType.LEVEL_UP_CREATURE, 1);
  }

  /**
   * Track gold collection
   */
  async trackCollectGold(userId: number, amount: number): Promise<void> {
    await this.trackProgress(userId, QuestObjectiveType.COLLECT_GOLD, amount);
  }

  /**
   * Track creature collection
   */
  async trackCollectCreature(userId: number, rarity?: string): Promise<void> {
    await this.trackProgress(userId, QuestObjectiveType.COLLECT_CREATURE, 1, { rarity });
  }

  /**
   * Get all completable quests for a user
   */
  async getCompletableQuests(userId: number): Promise<UserQuest[]> {
    return this.userQuestRepo
      .createQueryBuilder('uq')
      .leftJoinAndSelect('uq.quest', 'q')
      .where('uq.user_id = :userId', { userId })
      .andWhere('uq.completed = true')
      .andWhere('uq.claimed = false')
      .getMany();
  }

  /**
   * Auto-assign new daily/weekly quests cho user
   */
  async autoAssignQuests(userId: number): Promise<void> {
    try {
      // Get all active quests that user doesn't have yet
      const existingQuestIds = await this.userQuestRepo
        .createQueryBuilder('uq')
        .select('uq.quest_id')
        .where('uq.user_id = :userId', { userId })
        .getRawMany()
        .then((results: any[]) => results.map((r: any) => r.uq_quest_id));

      const availableQuests = await this.questRepo.find({
        where: {
          active: true,
          // Add more conditions based on user level, etc.
        },
      });

      // Filter quests user doesn't have
      const newQuests = availableQuests.filter(
        (quest: Quest) => !existingQuestIds.includes(quest.id),
      );

      // Auto-assign daily and weekly quests
      for (const quest of newQuests) {
        if (quest.type === 'DAILY' || quest.type === 'WEEKLY') {
          const expiresAt = new Date();
          if (quest.type === 'DAILY') {
            expiresAt.setHours(23, 59, 59, 999); // End of day
          } else {
            expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
          }

          const userQuest = this.userQuestRepo.create({
            user_id: userId,
            quest_id: quest.id,
            current_count: 0,
            completed: false,
            claimed: false,
            expires_at: expiresAt,
          });

          await this.userQuestRepo.save(userQuest);
        }
      }
    } catch (error) {
      console.error('Error auto-assigning quests:', error);
    }
  }
}
