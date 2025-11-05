import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from 'src/entities/rating.entity';

@ApiTags('leaderboard')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepo: Repository<Rating>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lấy bảng xếp hạng PVP' })
  async getLeaderboard(@Query('season') season: string = 'S1') {
    const top = await this.ratingRepo.find({
      where: { season },
      order: { rating: 'DESC' },
      take: 100,
    });
    return { season, leaderboard: top };
  }
}
