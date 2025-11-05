import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quest } from 'src/entities/quest.entity';
import { UserQuest } from 'src/entities/user-quest.entity';
import { User } from 'src/entities/user.entity';
import { QuestsController } from './quests.controller';
import { QuestsService } from './quests.service';
import { ItemsModule } from '../items/items.module';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([Quest, UserQuest, User]), ItemsModule, CommonModule],
  controllers: [QuestsController],
  providers: [QuestsService],
  exports: [QuestsService],
})
export class QuestsModule {}
