import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StartHuntDto {
  @ApiProperty({ 
    example: 'forest', 
    description: 'Zone ID to hunt in' 
  })
  @IsString()
  zone_id: string;

  @ApiProperty({
    example: 'client_seed_xyz',
    description: 'Client seed for RNG (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  client_seed?: string;
}
