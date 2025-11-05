import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/modules/redis/redis.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LockService {
  constructor(private readonly redisService: RedisService) {}

  /**
   * Acquire distributed lock với auto-expiry
   */
  async acquire(resource: string, ttlMs: number = 5000): Promise<string | null> {
    const lockKey = `lock:${resource}`;
    const lockValue = uuidv4();
    const acquired = await this.redisService.acquireLock(lockKey, lockValue, ttlMs);
    return acquired ? lockValue : null;
  }

  /**
   * Release lock
   */
  async release(resource: string, lockValue: string): Promise<boolean> {
    const lockKey = `lock:${resource}`;
    return this.redisService.releaseLock(lockKey, lockValue);
  }

  /**
   * Execute with lock (auto acquire & release)
   */
  async withLock<T>(resource: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
    const lockValue = await this.acquire(resource, ttlMs);
    if (!lockValue) {
      throw new Error(`Failed to acquire lock: ${resource}`);
    }

    try {
      return await fn();
    } finally {
      await this.release(resource, lockValue);
    }
  }
}
