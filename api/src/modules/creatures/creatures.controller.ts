import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RateLimitGuard, RateLimit } from 'src/common/guards/rate-limit.guard';
import { CreaturesService } from './creatures.service';
import { CreatureProgressionService } from 'src/common/services/creature-progression.service';
import { QuestProgressService } from 'src/common/services/quest-progress.service';

@ApiTags('creatures')
@Controller('creatures')
export class CreaturesController {
  constructor(
    private readonly creaturesService: CreaturesService,
    private readonly progressionService: CreatureProgressionService,
    private readonly questProgressService: QuestProgressService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách species theo rarity/element' })
  async listSpecies(@Query('rarity') rarity?: string, @Query('element') element?: string) {
    return this.creaturesService.listSpecies(rarity, element);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách creatures của user' })
  async getUserCreatures(@Req() req: any) {
    return this.creaturesService.getUserCreatures(req.user.id);
  }

  @Get('my/detailed')
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @RateLimit({ ttl: 60, limit: 30 })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lấy danh sách creatures với stats chi tiết',
    description: 'Bao gồm calculated stats, exp progress, evolution status',
  })
  @ApiResponse({
    status: 200,
    description: 'Detailed creatures list',
    schema: {
      example: {
        creatures: [
          {
            id: 1,
            species_id: 3,
            level: 25,
            exp: 15000,
            current_stats: {
              hp: 450,
              atk: 120,
              def: 85,
              spd: 95,
            },
            exp_to_next_level: 20000,
            exp_progress: '15000/20000',
            evolution: {
              can_evolve: true,
              next_species: 'Advanced Form',
            },
          },
        ],
      },
    },
  })
  async getUserCreaturesDetailed(@Req() req: any) {
    const creatures = await this.progressionService.getUserCreaturesWithStats(req.user.id);
    return { creatures };
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @RateLimit({ ttl: 60, limit: 60 })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xem stats chi tiết của 1 creature' })
  @ApiParam({ name: 'id', description: 'Creature ID' })
  @ApiResponse({
    status: 200,
    description: 'Creature stats',
    schema: {
      example: {
        creature_id: 1,
        level: 25,
        exp: 15000,
        exp_to_next: 20000,
        stats: {
          hp: 450,
          atk: 120,
          def: 85,
          spd: 95,
          crit_rate: 0.05,
          crit_dmg: 1.5,
          element: 'FIRE',
        },
      },
    },
  })
  async getCreatureStats(@Req() req: any, @Param('id', ParseIntPipe) creatureId: number) {
    // TODO: Add ownership check
    const stats = await this.progressionService.calculateCreatureStats({
      id: creatureId,
      user_id: req.user.id,
    } as any);

    return {
      creature_id: creatureId,
      stats,
    };
  }

  @Post(':id/evolve')
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @RateLimit({ ttl: 60, limit: 10 })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Tiến hóa creature',
    description: 'Evolve creature sang form tiếp theo (cần đủ level requirement)',
  })
  @ApiParam({ name: 'id', description: 'Creature ID' })
  @ApiResponse({
    status: 200,
    description: 'Evolution successful',
    schema: {
      example: {
        message: 'Evolution successful',
        creature: {
          id: 1,
          species_id: 4,
          level: 30,
          new_species_name: 'Advanced Form',
        },
      },
    },
  })
  async evolveCreature(@Req() req: any, @Param('id', ParseIntPipe) creatureId: number) {
    const evolved = await this.progressionService.evolveCreature(req.user.id, creatureId);

    return {
      message: 'Evolution successful',
      creature: evolved,
    };
  }

  @Get(':id/evolution-check')
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @RateLimit({ ttl: 60, limit: 60 })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Kiểm tra evolution status',
    description: 'Check xem creature có thể evolve không và requirements',
  })
  @ApiParam({ name: 'id', description: 'Creature ID' })
  @ApiResponse({
    status: 200,
    description: 'Evolution status',
    schema: {
      example: {
        canEvolve: true,
        nextEvolution: {
          id: 4,
          name: 'Advanced Form',
          rarity: 'EPIC',
        },
        requirements: {
          level: 30,
          item: null,
        },
      },
    },
  })
  async checkEvolution(@Req() req: any, @Param('id', ParseIntPipe) creatureId: number) {
    return this.progressionService.checkEvolution(creatureId);
  }
}
