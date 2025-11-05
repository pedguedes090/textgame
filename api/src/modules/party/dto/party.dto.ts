import { IsString, IsArray, IsOptional, MaxLength, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePartyDto {
  @ApiProperty({ example: 'My Main Team' })
  @IsString()
  @MaxLength(100)
  name: string;
}

export class UpdatePartyDto {
  @ApiProperty({ example: 'Updated Team Name', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiProperty({ example: [1, 2, 3, 4], required: false, description: 'Array of UserCreature IDs (max 4)' })
  @IsArray()
  @IsOptional()
  creature_ids?: number[];
}

export class SetActivePartyDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  party_id: number;
}

export class AddCreatureToPartyDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  party_id: number;

  @ApiProperty({ example: 5 })
  @IsNumber()
  creature_id: number;
}

export class RemoveCreatureFromPartyDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  party_id: number;

  @ApiProperty({ example: 5 })
  @IsNumber()
  creature_id: number;
}
