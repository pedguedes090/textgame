import { Test, TestingModule } from '@nestjs/testing';
import { LootService } from '../../src/common/services/loot.service';
import { gameConfig } from '../../src/config/game.config';

describe('LootService - Pity System', () => {
  let service: LootService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LootService],
    }).compile();

    service = module.get<LootService>(LootService);
  });

  it('should return base rate when pity counter < threshold', () => {
    const baseRate = 2.0; // 2% Legendary+
    const pityCounter = 30; // < 50
    
    const adjustedRate = service.calculatePityOdds(baseRate, pityCounter);
    
    expect(adjustedRate).toBe(baseRate);
  });

  it('should add +0.3% per roll after 50 miss', () => {
    const baseRate = 2.0;
    const pityCounter = 51; // 1 roll sau threshold 50
    
    const adjustedRate = service.calculatePityOdds(baseRate, pityCounter);
    
    // Expected: 2.0 + (51 - 50) * 0.3 = 2.3%
    expect(adjustedRate).toBe(2.3);
  });

  it('should accumulate pity bonus correctly', () => {
    const baseRate = 2.0;
    
    // Test various pity counters
    const testCases = [
      { counter: 50, expected: 2.0 },   // At threshold
      { counter: 55, expected: 3.5 },   // 2.0 + 5 * 0.3
      { counter: 60, expected: 5.0 },   // 2.0 + 10 * 0.3
      { counter: 70, expected: 8.0 },   // 2.0 + 20 * 0.3
      { counter: 100, expected: 17.0 }, // 2.0 + 50 * 0.3
    ];
    
    testCases.forEach(({ counter, expected }) => {
      const adjustedRate = service.calculatePityOdds(baseRate, counter);
      expect(adjustedRate).toBeCloseTo(expected, 1);
    });
  });

  it('should cap at 100% if pity goes too high', () => {
    const baseRate = 2.0;
    const veryHighCounter = 500; // Would give 2.0 + 450 * 0.3 = 137%
    
    const adjustedRate = service.calculatePityOdds(baseRate, veryHighCounter);
    
    // Should cap at 100%
    expect(adjustedRate).toBeLessThanOrEqual(100);
  });

  it('should reset pity when hitting Legendary+', () => {
    const baseRate = 2.0 + 0.8 + 0.2; // LEGENDARY + MYTHIC + ANCIENT = 3%
    
    // Simulate gacha rolls with pity
    let pityCounter = 0;
    let legendaryHits = 0;
    
    const mockRandom = () => Math.random();
    
    // Roll 200 times
    for (let i = 0; i < 200; i++) {
      const result = service.rollGacha(mockRandom, pityCounter);
      
      if (['LEGENDARY', 'MYTHIC', 'ANCIENT'].includes(result.rarity)) {
        legendaryHits++;
        pityCounter = 0; // Reset on hit
        expect(result.hitPity).toBe(pityCounter >= gameConfig.pity.threshold);
      } else {
        pityCounter++;
      }
    }
    
    // Should hit at least some Legendary+ in 200 rolls (statistical)
    expect(legendaryHits).toBeGreaterThan(0);
  });

  it('should flag when pity was triggered', () => {
    const baseRate = 3.0;
    const pityCounter = 60; // Above threshold, giving bonus
    
    // Mock random to always hit Legendary range
    const mockRandom = jest.fn()
      .mockReturnValueOnce(0.01) // Hit Legendary+ range
      .mockReturnValueOnce(0.5);  // Sub-roll
    
    const result = service.rollGacha(mockRandom, pityCounter);
    
    expect(result.hitPity).toBe(true);
    expect(['LEGENDARY', 'MYTHIC', 'ANCIENT']).toContain(result.rarity);
  });

  it('should not flag pity if hit before threshold', () => {
    const pityCounter = 20; // Below threshold
    
    // Force Legendary hit
    const mockRandom = jest.fn()
      .mockReturnValueOnce(0.01)
      .mockReturnValueOnce(0.5);
    
    const result = service.rollGacha(mockRandom, pityCounter);
    
    if (['LEGENDARY', 'MYTHIC', 'ANCIENT'].includes(result.rarity)) {
      expect(result.hitPity).toBe(false);
    }
  });

  it('should have consistent pity increment', () => {
    const baseRate = 3.0;
    const { threshold, increment } = gameConfig.pity;
    
    expect(threshold).toBe(50);
    expect(increment).toBe(0.3);
    
    // Test increment is applied correctly
    for (let i = threshold + 1; i <= threshold + 10; i++) {
      const rate = service.calculatePityOdds(baseRate, i);
      const expectedBonus = (i - threshold) * increment;
      const expectedRate = baseRate + expectedBonus;
      
      expect(rate).toBeCloseTo(expectedRate, 2);
    }
  });
});
