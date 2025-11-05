import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StaminaService } from '../services/stamina.service';

@Injectable()
export class StaminaRegenJob {
  private readonly logger = new Logger(StaminaRegenJob.name);

  constructor(private readonly staminaService: StaminaService) {}

  /**
   * Chạy mỗi 5 phút để regen stamina cho tất cả users
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async regenerateStamina() {
    try {
      this.logger.log('Starting stamina regeneration job...');
      const updated = await this.staminaService.regenerateAll();
      this.logger.log(`Stamina regeneration completed. Updated ${updated} users.`);
    } catch (error) {
      this.logger.error('Stamina regeneration failed:', error);
    }
  }

  /**
   * Optional: Chạy mỗi phút cho granularity cao hơn
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async regenerateStaminaFrequent() {
    try {
      const updated = await this.staminaService.regenerateAll();
      if (updated > 0) {
        this.logger.debug(`Fast regen: ${updated} users updated`);
      }
    } catch (error) {
      this.logger.error('Fast stamina regen failed:', error);
    }
  }
}
