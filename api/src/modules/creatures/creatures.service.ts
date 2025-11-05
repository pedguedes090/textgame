import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatureSpecies } from 'src/entities/creature-species.entity';
import { UserCreature } from 'src/entities/user-creature.entity';

@Injectable()
export class CreaturesService {
  constructor(
    @InjectRepository(CreatureSpecies)
    private readonly speciesRepo: Repository<CreatureSpecies>,
    @InjectRepository(UserCreature)
    private readonly userCreatureRepo: Repository<UserCreature>,
  ) {}

  async listSpecies(rarity?: string, element?: string) {
    const where: any = {};
    if (rarity) where.rarity = rarity;
    if (element) where.element = element;
    return this.speciesRepo.find({ where });
  }

  async getUserCreatures(userId: number) {
    return this.userCreatureRepo.find({
      where: { user_id: userId },
      relations: ['species'],
      order: { power_score: 'DESC' },
    });
  }
}
