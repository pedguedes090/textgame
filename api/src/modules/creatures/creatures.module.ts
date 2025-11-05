import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreatureSpecies } from 'src/entities/creature-species.entity';
import { UserCreature } from 'src/entities/user-creature.entity';
import { CreaturesController } from './creatures.controller';
import { CreaturesService } from './creatures.service';

@Module({
  imports: [TypeOrmModule.forFeature([CreatureSpecies, UserCreature])],
  controllers: [CreaturesController],
  providers: [CreaturesService],
})
export class CreaturesModule {}
