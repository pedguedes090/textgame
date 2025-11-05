import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GachaPity } from 'src/entities/gacha-pity.entity';
import { GachaController } from './gacha.controller';
import { GachaService } from './gacha.service';
import { CommonModule } from 'src/common/common.module';
import { ItemsModule } from '../items/items.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GachaPity]), 
    CommonModule,
    ItemsModule, // Import for ItemsService
  ],
  controllers: [GachaController],
  providers: [GachaService],
})
export class GachaModule {}
