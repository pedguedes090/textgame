import { IsString, IsArray, IsOptional, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RunDungeonDto {
  @ApiProperty({ example: 'D3', description: 'Dungeon ID' })
  @IsString()
  dungeon_id: string;

  @ApiProperty({ example: [101, 102, 103], description: 'Party creature IDs (1-5)' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  party: number[];

  @ApiProperty({
    example: 'abc123',
    description: 'Client seed cho commit-reveal RNG (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  client_seed?: string;
}
