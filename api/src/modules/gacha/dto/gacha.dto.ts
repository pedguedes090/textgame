import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OpenGachaDto {
  @ApiProperty({ 
    example: 'standard', 
    description: 'Banner ID (standard, premium, event)' 
  })
  @IsString()
  banner_id: string;

  @ApiProperty({
    example: 'player_seed_123',
    description: 'Client seed cho commit-reveal RNG (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  client_seed?: string;
}
