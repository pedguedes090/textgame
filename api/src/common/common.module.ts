import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { RngService } from './services/rng.service';
import { LockService } from './services/lock.service';
import { LootService } from './services/loot.service';
import { BattleService } from './services/battle.service';
import { PvpService } from './services/pvp.service';
import { StaminaService } from './services/stamina.service';
import { QuestProgressService } from './services/quest-progress.service';
import { CreatureProgressionService } from './services/creature-progression.service';
import { DailyRewardsService } from './services/daily-rewards.service';
import { StaminaRegenJob } from './jobs/stamina-regen.job';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { User } from 'src/entities/user.entity';
import { UserQuest } from 'src/entities/user-quest.entity';
import { Quest } from 'src/entities/quest.entity';
import { UserCreature } from 'src/entities/user-creature.entity';
import { CreatureSpecies } from 'src/entities/creature-species.entity';
import { DailyLoginReward } from 'src/entities/daily-login-reward.entity';
import { UserInventory } from 'src/entities/user-inventory.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserQuest,
      Quest,
      UserCreature,
      CreatureSpecies,
      DailyLoginReward,
      UserInventory,
    ]),
    ScheduleModule.forRoot(),
  ],
  providers: [
    RngService,
    LockService,
    LootService,
    BattleService,
    PvpService,
    StaminaService,
    QuestProgressService,
    CreatureProgressionService,
    DailyRewardsService,
    StaminaRegenJob,
    RateLimitGuard,
  ],
  exports: [
    RngService,
    LockService,
    LootService,
    BattleService,
    PvpService,
    StaminaService,
    QuestProgressService,
    CreatureProgressionService,
    DailyRewardsService,
    RateLimitGuard,
  ],
})
export class CommonModule {}
