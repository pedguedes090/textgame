import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopItem } from 'src/entities/shop-item.entity';
import { Item } from 'src/entities/item.entity';
import { User } from 'src/entities/user.entity';
import { UserInventory } from 'src/entities/user-inventory.entity';
import { ShopController } from './shop.controller';
import { ShopService } from './shop.service';
import { ItemsModule } from '../items/items.module';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShopItem, Item, User, UserInventory]),
    ItemsModule,
    CommonModule,
  ],
  controllers: [ShopController],
  providers: [ShopService],
  exports: [ShopService],
})
export class ShopModule {}
