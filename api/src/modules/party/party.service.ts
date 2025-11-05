import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Party } from 'src/entities/party.entity';
import { UserCreature } from 'src/entities/user-creature.entity';
import { CreatePartyDto, UpdatePartyDto } from './dto/party.dto';

@Injectable()
export class PartyService {
  constructor(
    @InjectRepository(Party)
    private readonly partyRepo: Repository<Party>,
    @InjectRepository(UserCreature)
    private readonly creatureRepo: Repository<UserCreature>,
  ) {}

  async createParty(userId: number, dto: CreatePartyDto) {
    const party = this.partyRepo.create({
      user_id: userId,
      name: dto.name,
      creature_ids: [],
      is_active: false,
    });

    return this.partyRepo.save(party);
  }

  async getUserParties(userId: number) {
    return this.partyRepo.find({
      where: { user_id: userId },
      order: { is_active: 'DESC', created_at: 'ASC' },
    });
  }

  async getPartyDetails(userId: number, partyId: number) {
    const party = await this.partyRepo.findOne({
      where: { id: partyId, user_id: userId },
    });

    if (!party) {
      throw new NotFoundException('Party not found');
    }

    // Fetch creature details
    let creatures: any[] = [];
    if (party.creature_ids && party.creature_ids.length > 0) {
      creatures = await this.creatureRepo
        .createQueryBuilder('uc')
        .leftJoinAndSelect('uc.species', 'species')
        .where('uc.id IN (:...ids)', { ids: party.creature_ids })
        .andWhere('uc.user_id = :userId', { userId })
        .getMany();
    }

    return {
      ...party,
      creatures,
    };
  }

  async updateParty(userId: number, partyId: number, dto: UpdatePartyDto) {
    const party = await this.partyRepo.findOne({
      where: { id: partyId, user_id: userId },
    });

    if (!party) {
      throw new NotFoundException('Party not found');
    }

    if (dto.name) {
      party.name = dto.name;
    }

    if (dto.creature_ids !== undefined) {
      if (dto.creature_ids.length > 4) {
        throw new BadRequestException('Maximum 4 creatures per party');
      }

      // Verify all creatures belong to user
      if (dto.creature_ids.length > 0) {
        const creatures = await this.creatureRepo.count({
          where: { 
            id: In(dto.creature_ids),
            user_id: userId,
          },
        });

        if (creatures !== dto.creature_ids.length) {
          throw new BadRequestException('Some creatures do not belong to you');
        }
      }

      party.creature_ids = dto.creature_ids;
    }

    return this.partyRepo.save(party);
  }

  async deleteParty(userId: number, partyId: number) {
    const party = await this.partyRepo.findOne({
      where: { id: partyId, user_id: userId },
    });

    if (!party) {
      throw new NotFoundException('Party not found');
    }

    if (party.is_active) {
      throw new BadRequestException('Cannot delete active party');
    }

    await this.partyRepo.remove(party);
    return { message: 'Party deleted successfully' };
  }

  async setActiveParty(userId: number, partyId: number) {
    const party = await this.partyRepo.findOne({
      where: { id: partyId, user_id: userId },
    });

    if (!party) {
      throw new NotFoundException('Party not found');
    }

    // Deactivate all other parties
    await this.partyRepo.update(
      { user_id: userId },
      { is_active: false },
    );

    // Activate this party
    party.is_active = true;
    return this.partyRepo.save(party);
  }

  async addCreatureToParty(userId: number, partyId: number, creatureId: number) {
    const party = await this.partyRepo.findOne({
      where: { id: partyId, user_id: userId },
    });

    if (!party) {
      throw new NotFoundException('Party not found');
    }

    // Check max party size
    if (party.creature_ids && party.creature_ids.length >= 4) {
      throw new BadRequestException('Party is full (max 4 creatures)');
    }

    // Verify creature belongs to user
    const creature = await this.creatureRepo.findOne({
      where: { id: creatureId, user_id: userId },
    });

    if (!creature) {
      throw new NotFoundException('Creature not found');
    }

    // Check if already in party
    if (party.creature_ids && party.creature_ids.includes(creatureId)) {
      throw new BadRequestException('Creature already in party');
    }

    party.creature_ids = [...(party.creature_ids || []), creatureId];
    return this.partyRepo.save(party);
  }

  async removeCreatureFromParty(userId: number, partyId: number, creatureId: number) {
    const party = await this.partyRepo.findOne({
      where: { id: partyId, user_id: userId },
    });

    if (!party) {
      throw new NotFoundException('Party not found');
    }

    if (!party.creature_ids || !party.creature_ids.includes(creatureId)) {
      throw new BadRequestException('Creature not in party');
    }

    party.creature_ids = party.creature_ids.filter(id => id !== creatureId);
    return this.partyRepo.save(party);
  }

  async getActiveParty(userId: number) {
    const party = await this.partyRepo.findOne({
      where: { user_id: userId, is_active: true },
    });

    if (!party) {
      return null;
    }

    return this.getPartyDetails(userId, party.id);
  }
}

// Import In for TypeORM
import { In } from 'typeorm';
