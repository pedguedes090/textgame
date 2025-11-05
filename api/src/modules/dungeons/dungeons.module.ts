import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dungeon } from 'src/entities/dungeon.entity';
import { DropTable } from 'src/entities/drop-table.entity';
import { UserCreature } from 'src/entities/user-creature.entity';
import { Battle } from 'src/entities/battle.entity';
import { UserInventory } from 'src/entities/user-inventory.entity';
import { User } from 'src/entities/user.entity';
import { DungeonsController } from './dungeons.controller';
import { DungeonsService } from './dungeons.service';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Dungeon, DropTable, UserCreature, Battle, UserInventory, User]),
    CommonModule,
  ],
  controllers: [DungeonsController],
  providers: [DungeonsService],
})
export class DungeonsModule {}
