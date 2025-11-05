import { IsNumber, Min, IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EnhanceItemDto {
  @ApiProperty({ 
    example: 1, 
    description: 'User inventory item ID' 
  })
  @IsNumber()
  @Min(1)
  item_id: number;
}

export class EquipItemDto {
  @ApiProperty({ example: 5, description: 'Creature ID' })
  @IsNumber()
  @Min(1)
  creature_id: number;

  @ApiProperty({ example: 10, description: 'Inventory item ID to equip' })
  @IsNumber()
  @Min(1)
  inventory_item_id: number;
}

export class UnequipItemDto {
  @ApiProperty({ example: 5, description: 'Creature ID' })
  @IsNumber()
  @Min(1)
  creature_id: number;

  @ApiProperty({ 
    example: 'weapon_id', 
    description: 'Slot to unequip',
    enum: ['weapon_id', 'armor_id', 'charm_id', 'ring_id']
  })
  @IsString()
  @IsIn(['weapon_id', 'armor_id', 'charm_id', 'ring_id'])
  slot: string;
}
