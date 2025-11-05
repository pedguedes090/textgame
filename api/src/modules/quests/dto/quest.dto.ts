import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ClaimQuestDto {
  @ApiProperty({ example: 1, description: 'User quest ID' })
  @IsNumber()
  @Min(1)
  user_quest_id: number;
}
