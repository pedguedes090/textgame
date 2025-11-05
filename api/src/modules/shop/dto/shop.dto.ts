import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BuyItemDto {
  @ApiProperty({ example: 1, description: 'Shop item ID' })
  @IsNumber()
  @Min(1)
  shop_item_id: number;

  @ApiProperty({ example: 1, description: 'Quantity to buy', required: false })
  @IsNumber()
  @IsOptional()
  @Min(1)
  quantity?: number;
}

export class SellItemDto {
  @ApiProperty({ example: 10, description: 'User inventory item ID' })
  @IsNumber()
  @Min(1)
  inventory_item_id: number;

  @ApiProperty({ example: 1, description: 'Quantity to sell', required: false })
  @IsNumber()
  @IsOptional()
  @Min(1)
  quantity?: number;
}
