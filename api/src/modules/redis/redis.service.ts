import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  onModuleInit() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    this.client.on('connect', () => {
      console.log('✅ Redis connected');
    });
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  getClient(): Redis {
    return this.client;
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }

  // Rate limiting with Lua script
  async checkRateLimit(key: string, limit: number, ttl: number): Promise<boolean> {
    const script = `
      local key = KEYS[1]
      local limit = tonumber(ARGV[1])
      local ttl = tonumber(ARGV[2])
      local current = tonumber(redis.call('GET', key) or "0")
      if current >= limit then
        return 0
      else
        redis.call('INCR', key)
        redis.call('EXPIRE', key, ttl)
        return 1
      end
    `;
    const result = await this.client.eval(script, 1, key, limit, ttl);
    return result === 1;
  }

  // Distributed lock (SET NX PX)
  async acquireLock(lockKey: string, lockValue: string, ttlMs: number): Promise<boolean> {
    const result = await this.client.set(lockKey, lockValue, 'PX', ttlMs, 'NX');
    return result === 'OK';
  }

  async releaseLock(lockKey: string, lockValue: string): Promise<boolean> {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    const result = await this.client.eval(script, 1, lockKey, lockValue);
    return result === 1;
  }

  // Token bucket for stamina regen
  async getStamina(userId: number, max: number): Promise<number> {
    const key = `stamina:${userId}`;
    const value = await this.client.get(key);
    return value ? Math.min(parseInt(value, 10), max) : max;
  }

  async setStamina(userId: number, value: number): Promise<void> {
    const key = `stamina:${userId}`;
    await this.client.set(key, value);
  }

  async decrStamina(userId: number, amount: number): Promise<number> {
    const key = `stamina:${userId}`;
    return this.client.decrby(key, amount);
  }
}
