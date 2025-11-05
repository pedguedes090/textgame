import { Test, TestingModule } from '@nestjs/testing';
import { LootService } from '../../src/common/services/loot.service';

describe('LootService - Alias Method', () => {
  let service: LootService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LootService],
    }).compile();

    service = module.get<LootService>(LootService);
  });

  it('should build alias table correctly', () => {
    const weights = [1, 2, 3, 4];
    const aliasTable = service.buildAliasTable(weights);

    expect(aliasTable.prob).toHaveLength(4);
    expect(aliasTable.alias).toHaveLength(4);
    
    // All probabilities should be between 0 and 1
    aliasTable.prob.forEach(p => {
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    });
  });

  it('should sample with correct distribution (chi-square test)', () => {
    const weights = [10, 20, 30, 40]; // 10%, 20%, 30%, 40%
    const aliasTable = service.buildAliasTable(weights);
    
    const samples = 10000;
    const counts = [0, 0, 0, 0];
    
    // Sample many times
    for (let i = 0; i < samples; i++) {
      const random = Math.random();
      const index = service.sampleAlias(aliasTable, random);
      counts[index]++;
    }
    
    // Check distribution (with 5% tolerance)
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    weights.forEach((weight, i) => {
      const expectedRatio = weight / totalWeight;
      const actualRatio = counts[i] / samples;
      const error = Math.abs(actualRatio - expectedRatio);
      
      // Allow 5% error margin
      expect(error).toBeLessThan(0.05);
    });
  });

  it('should handle edge case: single weight', () => {
    const weights = [100];
    const aliasTable = service.buildAliasTable(weights);
    
    // Always should return index 0
    for (let i = 0; i < 100; i++) {
      const index = service.sampleAlias(aliasTable, Math.random());
      expect(index).toBe(0);
    }
  });

  it('should handle edge case: equal weights', () => {
    const weights = [1, 1, 1, 1];
    const aliasTable = service.buildAliasTable(weights);
    
    const samples = 1000;
    const counts = [0, 0, 0, 0];
    
    for (let i = 0; i < samples; i++) {
      const random = Math.random();
      const index = service.sampleAlias(aliasTable, random);
      counts[index]++;
    }
    
    // Each should be ~25% (±5%)
    counts.forEach(count => {
      const ratio = count / samples;
      expect(ratio).toBeGreaterThan(0.2);
      expect(ratio).toBeLessThan(0.3);
    });
  });

  it('should be O(1) sampling performance', () => {
    const largeWeights = Array(1000).fill(1); // 1000 items
    const aliasTable = service.buildAliasTable(largeWeights);
    
    const iterations = 10000;
    const start = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      service.sampleAlias(aliasTable, Math.random());
    }
    
    const elapsed = Date.now() - start;
    
    // Should be very fast (< 100ms for 10k samples)
    expect(elapsed).toBeLessThan(100);
  });
});
