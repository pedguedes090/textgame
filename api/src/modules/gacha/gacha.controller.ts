import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RateLimitGuard, RateLimit } from 'src/common/guards/rate-limit.guard';
import { GachaService } from './gacha.service';
import { OpenGachaDto } from './dto/gacha.dto';

@ApiTags('gacha')
@Controller('gacha')
export class GachaController {
  constructor(private readonly gachaService: GachaService) {}

  @Post('open')
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @RateLimit({ ttl: 60, limit: 20 }) // Max 20 rolls per minute
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Mở gacha với pity & commit-reveal',
    description: 'Roll gacha với transparent odds, pity system (+0.3%/roll sau 50 miss), và provably fair RNG'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Kết quả gacha với odds, pity status, và RNG proof',
    schema: {
      example: {
        rarity: 'LEGENDARY',
        hit_pity: false,
        pity_counter_after: 0,
        odds: {
          base: { COMMON: 55, UNCOMMON: 25, RARE: 12, EPIC: 6, LEGENDARY: 2, MYTHIC: 0.8, ANCIENT: 0.2 },
          adjusted_legendary_plus: 3.0
        },
        seed_commit: 'hash_abc...',
        server_seed_reveal: 'seed_xyz...'
      }
    }
  })
  async openGacha(@Req() req: any, @Body() dto: OpenGachaDto) {
    return this.gachaService.openGacha(req.user.id, dto.banner_id, dto.client_seed);
  }
}
