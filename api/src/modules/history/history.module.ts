import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Battle } from 'src/entities/battle.entity';
import { PvpMatch } from 'src/entities/pvp-match.entity';
import { HistoryController } from './history.controller';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([Battle, PvpMatch]), CommonModule],
  controllers: [HistoryController],
})
export class HistoryModule {}
