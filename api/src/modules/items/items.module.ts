import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { UserInventory } from 'src/entities/user-inventory.entity';
import { Item } from 'src/entities/item.entity';
import { User } from 'src/entities/user.entity';
import { UserCreature } from 'src/entities/user-creature.entity';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserInventory, Item, User, UserCreature]), CommonModule],
  controllers: [ItemsController],
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ItemsModule {}
