import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PvpMatch } from 'src/entities/pvp-match.entity';
import { Rating } from 'src/entities/rating.entity';
import { PvpController } from './pvp.controller';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([PvpMatch, Rating]), CommonModule],
  controllers: [PvpController],
})
export class PvpModule {}
