import { Controller, Post, UseGuards, Body, Req, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RateLimitGuard, RateLimit } from 'src/common/guards/rate-limit.guard';
import { StartHuntDto } from './dto/hunt.dto';
import { RngService } from 'src/common/services/rng.service';
import { StaminaService } from 'src/common/services/stamina.service';
import { QuestProgressService } from 'src/common/services/quest-progress.service';
import { UserCreature } from 'src/entities/user-creature.entity';
import { CreatureSpecies } from 'src/entities/creature-species.entity';

@ApiTags('hunt')
@Controller('hunt')
export class HuntController {
  constructor(
    private readonly rngService: RngService,
    private readonly staminaService: StaminaService,
    private readonly questProgressService: QuestProgressService,
    @InjectRepository(UserCreature)
    private readonly creatureRepo: Repository<UserCreature>,
    @InjectRepository(CreatureSpecies)
    private readonly speciesRepo: Repository<CreatureSpecies>,
  ) {}

  @Post('start')
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @RateLimit({ ttl: 60, limit: 40 })
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Bắt đầu săn thú',
    description: 'Hunt creatures trong zone với random encounter (simplified dungeon)'
  })
  @ApiResponse({
    status: 200,
    description: 'Kết quả hunt',
    schema: {
      example: {
        success: true,
        creature_caught: {
          id: 123,
          species_id: 3,
          species_name: 'Forest Sprite',
          rarity: 'RARE',
          level: 1,
          iv_rolls: { hp: 20, atk: 15, def: 18, spd: 25 },
          power_score: 450
        },
        seed_commit: 'hash_abc...',
        server_seed_reveal: 'seed_xyz...'
      }
    }
  })
  async startHunt(@Req() req: any, @Body() dto: StartHuntDto) {
    const userId = req.user.id;
    const HUNT_STAMINA_COST = 10;
    
    // Deduct stamina (throws if insufficient)
    await this.staminaService.deductStamina(userId, HUNT_STAMINA_COST);
    
    const serverSeed = this.rngService.generateServerSeed();
    const seedCommit = this.rngService.generateCommit(serverSeed);
    const combined = this.rngService.combinedSeed(dto.client_seed || 'default', serverSeed);
    
    // Random encounter
    const encounterRoll = this.rngService.rollFloat(combined, 0);
    const success = encounterRoll < 0.7; // 70% success rate
    
    if (success) {
      // Roll species (1-10 from seed data)
      const speciesId = Math.floor(this.rngService.rollFloat(combined, 1) * 10) + 1;
      
      // Get species from DB
      const species = await this.speciesRepo.findOne({ where: { id: speciesId } });
      if (!species) {
        throw new NotFoundException('Species not found');
      }
      
      // Roll IVs (0-31)
      const ivRolls = {
        hp: Math.floor(this.rngService.rollFloat(combined, 2) * 32),
        atk: Math.floor(this.rngService.rollFloat(combined, 3) * 32),
        def: Math.floor(this.rngService.rollFloat(combined, 4) * 32),
        spd: Math.floor(this.rngService.rollFloat(combined, 5) * 32),
      };
      
      // Calculate power score
      const baseStats = JSON.parse(species.base_stats);
      const powerScore = Math.floor(
        (baseStats.hp + ivRolls.hp) * 0.5 +
        (baseStats.atk + ivRolls.atk) * 1.2 +
        (baseStats.def + ivRolls.def) * 0.8 +
        (baseStats.spd + ivRolls.spd) * 1.0
      );
      
      // Save captured creature
      const creature = this.creatureRepo.create({
        user_id: userId,
        species_id: speciesId,
        level: 1,
        exp: 0,
        iv_rolls: JSON.stringify(ivRolls),
        power_score: powerScore,
        skills: '[]',
      });
      await this.creatureRepo.save(creature);
      
      // Track quest progress
      await this.questProgressService.trackHunt(userId);
      await this.questProgressService.trackCollectCreature(userId, species.rarity);
      
      return {
        success: true,
        creature_caught: {
          id: creature.id,
          species_id: speciesId,
          species_name: species.name,
          rarity: species.rarity,
          level: 1,
          iv_rolls: ivRolls,
          power_score: powerScore,
        },
        seed_commit: seedCommit,
        server_seed_reveal: serverSeed,
      };
    }
    
    return {
      success: false,
      message: 'No creature encountered',
      seed_commit: seedCommit,
      server_seed_reveal: serverSeed,
    };
  }
}
