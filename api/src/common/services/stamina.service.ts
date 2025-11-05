import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { gameConfig } from 'src/config/game.config';

@Injectable()
export class StaminaService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Check và trừ stamina
   */
  async deductStamina(userId: number, amount: number): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Regenerate stamina trước khi check
    const now = Date.now();
    const timeSinceUpdate = now - user.stamina_updated_at;
    const regenIntervals = Math.floor(timeSinceUpdate / gameConfig.stamina.regenInterval);
    
    if (regenIntervals > 0) {
      const newStamina = Math.min(
        user.stamina + (regenIntervals * gameConfig.stamina.regenAmount),
        gameConfig.stamina.max
      );
      user.stamina = newStamina;
      user.stamina_updated_at = now;
    }

    // Check sufficient
    if (user.stamina < amount) {
      const timeUntilNextRegen = gameConfig.stamina.regenInterval - (timeSinceUpdate % gameConfig.stamina.regenInterval);
      throw new BadRequestException(
        `Insufficient stamina. Need ${amount}, have ${user.stamina}. Next regen in ${Math.ceil(timeUntilNextRegen / 1000)}s`
      );
    }

    // Deduct
    user.stamina -= amount;
    await this.userRepo.save(user);
    
    return user;
  }

  /**
   * Get current stamina với regen calculation
   */
  async getCurrentStamina(userId: number): Promise<{ stamina: number; max: number; nextRegenIn: number }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const now = Date.now();
    const timeSinceUpdate = now - user.stamina_updated_at;
    const regenIntervals = Math.floor(timeSinceUpdate / gameConfig.stamina.regenInterval);
    
    let currentStamina = user.stamina;
    if (regenIntervals > 0) {
      currentStamina = Math.min(
        user.stamina + (regenIntervals * gameConfig.stamina.regenAmount),
        gameConfig.stamina.max
      );
    }

    const timeUntilNextRegen = gameConfig.stamina.regenInterval - (timeSinceUpdate % gameConfig.stamina.regenInterval);

    return {
      stamina: currentStamina,
      max: gameConfig.stamina.max,
      nextRegenIn: Math.ceil(timeUntilNextRegen / 1000), // seconds
    };
  }

  /**
   * Force regenerate stamina (cho background job)
   */
  async regenerateAll(): Promise<number> {
    const now = Date.now();
    
    // Find users cần regen (stamina < max và đã qua 1 regen interval)
    const users = await this.userRepo
      .createQueryBuilder('user')
      .where('user.stamina < :max', { max: gameConfig.stamina.max })
      .andWhere('(:now - user.stamina_updated_at) >= :interval', {
        now,
        interval: gameConfig.stamina.regenInterval,
      })
      .getMany();

    let updated = 0;
    for (const user of users) {
      const timeSinceUpdate = now - user.stamina_updated_at;
      const regenIntervals = Math.floor(timeSinceUpdate / gameConfig.stamina.regenInterval);
      
      if (regenIntervals > 0) {
        user.stamina = Math.min(
          user.stamina + (regenIntervals * gameConfig.stamina.regenAmount),
          gameConfig.stamina.max
        );
        user.stamina_updated_at = now;
        await this.userRepo.save(user);
        updated++;
      }
    }

    return updated;
  }
}
