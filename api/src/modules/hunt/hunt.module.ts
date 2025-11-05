import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HuntController } from './hunt.controller';
import { UserCreature } from 'src/entities/user-creature.entity';
import { CreatureSpecies } from 'src/entities/creature-species.entity';
import { User } from 'src/entities/user.entity';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserCreature, CreatureSpecies, User]),
    CommonModule,
  ],
  controllers: [HuntController],
})
export class HuntModule {}
