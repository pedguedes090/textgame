import { Test, TestingModule } from '@nestjs/testing';
import { PvpService, EloUpdate } from '../../src/common/services/pvp.service';
import { gameConfig } from '../../src/config/game.config';

describe('PvpService - Elo Rating', () => {
  let service: PvpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PvpService],
    }).compile();

    service = module.get<PvpService>(PvpService);
  });

  describe('Expected Score', () => {
    it('should calculate expected score correctly', () => {
      // Equal ratings = 50% expected
      const result1 = service.calculateElo(1500, 1500, 'WIN_A');
      // When equal, winner gains ~K/2, loser loses ~K/2
      expect(Math.abs(result1.playerA.delta)).toBeCloseTo(gameConfig.pvp.kFactor / 2, 0);
      expect(Math.abs(result1.playerB.delta)).toBeCloseTo(gameConfig.pvp.kFactor / 2, 0);

      // Higher rating should have negative delta when losing
      const result2 = service.calculateElo(1700, 1500, 'WIN_B');
      expect(result2.playerA.delta).toBeLessThan(0); // Higher rated loses more
      expect(result2.playerB.delta).toBeGreaterThan(0);
    });
  });

  describe('Win/Loss/Draw', () => {
    it('should increase winner rating and decrease loser rating', () => {
      const ratingA = 1500;
      const ratingB = 1500;

      const result = service.calculateElo(ratingA, ratingB, 'WIN_A');

      expect(result.playerA.newRating).toBeGreaterThan(ratingA);
      expect(result.playerB.newRating).toBeLessThan(ratingB);
      expect(result.playerA.delta).toBeGreaterThan(0);
      expect(result.playerB.delta).toBeLessThan(0);
    });

    it('should handle draw correctly', () => {
      const ratingA = 1500;
      const ratingB = 1500;

      const result = service.calculateElo(ratingA, ratingB, 'DRAW');

      // Equal ratings + draw = no change
      expect(result.playerA.newRating).toBe(ratingA);
      expect(result.playerB.newRating).toBe(ratingB);
      expect(result.playerA.delta).toBe(0);
      expect(result.playerB.delta).toBe(0);
    });

    it('should give more points when beating higher rated opponent', () => {
      const lowRating = 1400;
      const highRating = 1600;

      const result = service.calculateElo(lowRating, highRating, 'WIN_A');

      // Underdog wins = bigger gain
      expect(result.playerA.delta).toBeGreaterThan(gameConfig.pvp.kFactor / 2);
      expect(result.playerB.delta).toBeLessThan(-gameConfig.pvp.kFactor / 2);
    });

    it('should lose more points when losing to lower rated opponent', () => {
      const highRating = 1600;
      const lowRating = 1400;

      const result = service.calculateElo(highRating, lowRating, 'WIN_B');

      // Favorite loses = bigger loss
      expect(result.playerA.delta).toBeLessThan(-gameConfig.pvp.kFactor / 2);
      expect(result.playerB.delta).toBeGreaterThan(gameConfig.pvp.kFactor / 2);
    });
  });

  describe('Rating Conservation', () => {
    it('should conserve total rating points (zero-sum)', () => {
      const ratingA = 1500;
      const ratingB = 1600;

      const testResults: ('WIN_A' | 'WIN_B' | 'DRAW')[] = ['WIN_A', 'WIN_B', 'DRAW'];

      testResults.forEach(result => {
        const eloResult = service.calculateElo(ratingA, ratingB, result);
        
        // Delta A + Delta B should be ~0 (minor rounding acceptable)
        const totalDelta = eloResult.playerA.delta + eloResult.playerB.delta;
        expect(Math.abs(totalDelta)).toBeLessThanOrEqual(1); // Allow 1 point rounding
      });
    });
  });

  describe('Extreme Rating Differences', () => {
    it('should give minimal gain when high rated beats low rated', () => {
      const highRating = 2000;
      const lowRating = 1200;

      const result = service.calculateElo(highRating, lowRating, 'WIN_A');

      // Expected win = small gain
      expect(result.playerA.delta).toBeGreaterThan(0);
      expect(result.playerA.delta).toBeLessThan(5); // Very small gain
    });

    it('should lose minimal points when low rated loses to high rated', () => {
      const lowRating = 1200;
      const highRating = 2000;

      const result = service.calculateElo(lowRating, highRating, 'WIN_B');

      // Expected loss = small penalty
      expect(result.playerA.delta).toBeLessThan(0);
      expect(Math.abs(result.playerA.delta)).toBeLessThan(5);
    });

    it('should handle huge upsets correctly', () => {
      const lowRating = 1000;
      const highRating = 2500;

      const result = service.calculateElo(lowRating, highRating, 'WIN_A');

      // Massive upset = huge gain for winner
      expect(result.playerA.delta).toBeGreaterThan(gameConfig.pvp.kFactor * 0.9);
      expect(result.playerB.delta).toBeLessThan(-gameConfig.pvp.kFactor * 0.9);
    });
  });

  describe('K-Factor', () => {
    it('should use configured K-factor', () => {
      const k = gameConfig.pvp.kFactor;
      expect(k).toBe(32);

      // Equal ratings, win should give exactly K/2
      const result = service.calculateElo(1500, 1500, 'WIN_A');
      expect(result.playerA.delta).toBe(k / 2);
      expect(result.playerB.delta).toBe(-k / 2);
    });
  });

  describe('Rating Bounds', () => {
    it('should not allow rating to go below reasonable minimum', () => {
      const lowRating = 100;
      const normalRating = 1500;

      const result = service.calculateElo(lowRating, normalRating, 'WIN_B');

      // Even with loss, should remain positive
      expect(result.playerA.newRating).toBeGreaterThan(0);
    });
  });

  describe('Series of Matches', () => {
    it('should converge ratings after many matches', () => {
      let ratingA = 1500;
      let ratingB = 1500;

      // Simulate A winning 70% of the time
      for (let i = 0; i < 100; i++) {
        const result = service.calculateElo(
          ratingA,
          ratingB,
          i % 10 < 7 ? 'WIN_A' : 'WIN_B'
        );
        
        ratingA = result.playerA.newRating;
        ratingB = result.playerB.newRating;
      }

      // A should be significantly higher
      expect(ratingA).toBeGreaterThan(ratingB + 200);
    });
  });
});
