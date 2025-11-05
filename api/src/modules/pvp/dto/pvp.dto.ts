import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QueuePvpDto {
  @ApiProperty({
    example: 'S1',
    description: 'Season (default: current season)',
    required: false,
  })
  @IsOptional()
  @IsString()
  season?: string;
}

export class SubmitPvpResultDto {
  @ApiProperty({ example: 123, description: 'Match ID' })
  @IsString()
  match_id: string;

  @ApiProperty({
    example: 'A',
    description: 'Result: A (player A wins), B (player B wins), or DRAW',
  })
  @IsString()
  result: 'A' | 'B' | 'DRAW';

  @ApiProperty({
    example: 'proof_hash_abc123',
    description: 'Proof for verification (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  proof?: string;
}
