import { Test, TestingModule } from '@nestjs/testing';
import { LockService } from '../../src/common/services/lock.service';
import { RedisService } from '../../src/modules/redis/redis.service';

describe('Lock Service - Idempotency & Double-Claim Prevention', () => {
  let lockService: LockService;
  let redisService: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LockService,
        {
          provide: RedisService,
          useValue: {
            client: {
              set: jest.fn(),
              eval: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    lockService = module.get<LockService>(LockService);
    redisService = module.get<RedisService>(RedisService);
  });

  describe('Lock Acquisition', () => {
    it('should acquire lock successfully', async () => {
      jest.spyOn(redisService.client, 'set').mockResolvedValue('OK' as any);

      const token = await lockService.acquire('resource:123', 5000);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(redisService.client.set).toHaveBeenCalledWith(
        'lock:resource:123',
        expect.any(String),
        'PX',
        5000,
        'NX',
      );
    });

    it('should fail to acquire when lock already held', async () => {
      jest.spyOn(redisService.client, 'set').mockResolvedValue(null as any);

      const token = await lockService.acquire('resource:123', 5000);

      expect(token).toBeNull();
    });

    it('should handle concurrent acquisition attempts', async () => {
      let callCount = 0;
      jest.spyOn(redisService.client, 'set').mockImplementation(() => {
        callCount++;
        // First call succeeds, rest fail
        return Promise.resolve(callCount === 1 ? ('OK' as any) : (null as any));
      });

      // Simulate 10 concurrent requests
      const results = await Promise.all(
        Array(10)
          .fill(0)
          .map(() => lockService.acquire('resource:123', 5000)),
      );

      // Only one should succeed
      const successful = results.filter((r) => r !== null);
      expect(successful).toHaveLength(1);
      expect(callCount).toBe(10);
    });
  });

  describe('Lock Release', () => {
    it('should release lock with correct token', async () => {
      jest.spyOn(redisService.client, 'eval').mockResolvedValue(1 as any);

      const released = await lockService.release('resource:123', 'valid-token');

      expect(released).toBe(true);
      expect(redisService.client.eval).toHaveBeenCalled();
    });

    it('should fail to release with wrong token', async () => {
      jest.spyOn(redisService.client, 'eval').mockResolvedValue(0 as any);

      const released = await lockService.release('resource:123', 'wrong-token');

      expect(released).toBe(false);
    });

    it('should not release expired lock', async () => {
      jest.spyOn(redisService.client, 'eval').mockResolvedValue(0 as any);

      const released = await lockService.release('resource:123', 'expired-token');

      expect(released).toBe(false);
    });
  });

  describe('Double-Claim Prevention', () => {
    it('should prevent double claim of rewards', async () => {
      let lockAcquired = false;

      jest.spyOn(redisService.client, 'set').mockImplementation(() => {
        if (!lockAcquired) {
          lockAcquired = true;
          return Promise.resolve('OK' as any);
        }
        return Promise.resolve(null as any);
      });

      jest.spyOn(redisService.client, 'eval').mockResolvedValue(1 as any);

      // Simulate reward claim function
      const claimReward = async (userId: number, rewardId: number) => {
        const lockKey = `claim:${userId}:${rewardId}`;
        const token = await lockService.acquire(lockKey, 5000);

        if (!token) {
          throw new Error('Reward already claimed');
        }

        try {
          // Simulate reward processing
          await new Promise((resolve) => setTimeout(resolve, 10));
          return { success: true, reward: 'Gold x100' };
        } finally {
          await lockService.release(lockKey, token);
        }
      };

      // First claim should succeed
      const result1 = await claimReward(1, 123);
      expect(result1.success).toBe(true);

      // Second claim should fail
      await expect(claimReward(1, 123)).rejects.toThrow('Reward already claimed');
    });

    it('should allow claim after lock expires', async () => {
      let attemptCount = 0;

      jest.spyOn(redisService.client, 'set').mockImplementation(() => {
        attemptCount++;
        // First attempt succeeds, second fails, third succeeds (simulating expiry)
        if (attemptCount === 1 || attemptCount === 3) {
          return Promise.resolve('OK' as any);
        }
        return Promise.resolve(null as any);
      });

      const token1 = await lockService.acquire('claim:expired', 5000);
      expect(token1).toBeTruthy();

      const token2 = await lockService.acquire('claim:expired', 5000);
      expect(token2).toBeNull();

      // Simulate lock expiry
      const token3 = await lockService.acquire('claim:expired', 5000);
      expect(token3).toBeTruthy();
    });
  });

  describe('Retry with Backoff', () => {
    it('should retry and eventually acquire lock', async () => {
      let attempts = 0;

      jest.spyOn(redisService.client, 'set').mockImplementation(() => {
        attempts++;
        // Fail first 2 attempts, succeed on 3rd
        if (attempts >= 3) {
          return Promise.resolve('OK' as any);
        }
        return Promise.resolve(null as any);
      });

      const token = await lockService.acquireWithRetry('resource:retry', 5000, 5, 50);

      expect(token).toBeTruthy();
      expect(attempts).toBe(3);
    });

    it('should give up after max retries', async () => {
      jest.spyOn(redisService.client, 'set').mockResolvedValue(null as any);

      const token = await lockService.acquireWithRetry('resource:retry', 5000, 3, 50);

      expect(token).toBeNull();
    });
  });

  describe('Idempotency in Transaction Context', () => {
    it('should ensure only one transaction processes', async () => {
      const processedIds = new Set<string>();

      jest.spyOn(redisService.client, 'set').mockImplementation((key: string) => {
        if (processedIds.has(key)) {
          return Promise.resolve(null as any);
        }
        processedIds.add(key);
        return Promise.resolve('OK' as any);
      });

      jest.spyOn(redisService.client, 'eval').mockImplementation((script, numKeys, key: string) => {
        if (processedIds.has(key)) {
          processedIds.delete(key);
          return Promise.resolve(1 as any);
        }
        return Promise.resolve(0 as any);
      });

      const processTransaction = async (txId: string) => {
        return lockService.withLock(`tx:${txId}`, 5000, async () => {
          // Simulate transaction processing
          await new Promise((resolve) => setTimeout(resolve, 10));
          return { txId, processed: true };
        });
      };

      // Process same transaction ID multiple times concurrently
      const results = await Promise.allSettled([
        processTransaction('tx123'),
        processTransaction('tx123'),
        processTransaction('tx123'),
      ]);

      // Only one should succeed
      const successful = results.filter((r) => r.status === 'fulfilled');
      const failed = results.filter((r) => r.status === 'rejected');

      expect(successful.length).toBe(1);
      expect(failed.length).toBe(2);
    });
  });

  describe('Lock Renewal', () => {
    it('should renew lock with correct token', async () => {
      jest.spyOn(redisService.client, 'eval').mockResolvedValue(1 as any);

      const renewed = await lockService.renew('resource:123', 'valid-token', 10000);

      expect(renewed).toBe(true);
    });

    it('should fail to renew with wrong token', async () => {
      jest.spyOn(redisService.client, 'eval').mockResolvedValue(0 as any);

      const renewed = await lockService.renew('resource:123', 'wrong-token', 10000);

      expect(renewed).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle Redis connection errors gracefully', async () => {
      jest.spyOn(redisService.client, 'set').mockRejectedValue(new Error('Redis error'));

      const token = await lockService.acquire('resource:error', 5000);

      expect(token).toBeNull();
    });

    it('should handle very short TTL', async () => {
      jest.spyOn(redisService.client, 'set').mockResolvedValue('OK' as any);

      const token = await lockService.acquire('resource:short', 100);

      expect(token).toBeTruthy();
      expect(redisService.client.set).toHaveBeenCalledWith(
        'lock:resource:short',
        expect.any(String),
        'PX',
        100,
        'NX',
      );
    });

    it('should generate unique tokens', async () => {
      jest.spyOn(redisService.client, 'set').mockResolvedValue('OK' as any);

      const token1 = await lockService.acquire('resource:unique1', 5000);
      const token2 = await lockService.acquire('resource:unique2', 5000);

      expect(token1).not.toBe(token2);
    });
  });
});
