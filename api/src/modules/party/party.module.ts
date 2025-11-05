import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Party } from 'src/entities/party.entity';
import { UserCreature } from 'src/entities/user-creature.entity';
import { PartyController } from './party.controller';
import { PartyService } from './party.service';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([Party, UserCreature]), CommonModule],
  controllers: [PartyController],
  providers: [PartyService],
  exports: [PartyService],
})
export class PartyModule {}
