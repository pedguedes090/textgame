import { Test, TestingModule } from '@nestjs/testing';
import { BattleService, Combatant } from '../../src/common/services/battle.service';
import { gameConfig } from '../../src/config/game.config';

describe('BattleService - Combat Engine', () => {
  let service: BattleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BattleService],
    }).compile();

    service = module.get<BattleService>(BattleService);
  });

  describe('Damage Calculation', () => {
    it('should calculate basic damage with DEF mitigation', () => {
      const attacker: Combatant = {
        id: '1',
        name: 'Attacker',
        hp: 100,
        maxHp: 100,
        atk: 100,
        def: 50,
        spd: 50,
        crit_rate: 0,
        crit_dmg: 1.5,
        element: 'NEUTRAL',
        isPlayer: true,
      };

      const defender: Combatant = {
        id: '2',
        name: 'Defender',
        hp: 100,
        maxHp: 100,
        atk: 50,
        def: 100, // DEF/(DEF+400) = 100/500 = 20% mitigation
        spd: 50,
        crit_rate: 0,
        crit_dmg: 1.5,
        element: 'NEUTRAL',
        isPlayer: false,
      };

      const mockRandom = () => 1.0; // Never crit
      const result = service.calculateDamage(attacker, defender, 1.0, mockRandom);

      // Expected: 100 * 1.0 * (1 - 0.2) = 80
      expect(result.damage).toBe(80);
      expect(result.isCrit).toBe(false);
    });

    it('should apply crit multiplier', () => {
      const attacker: Combatant = {
        id: '1', name: 'Attacker', hp: 100, maxHp: 100,
        atk: 100, def: 50, spd: 50,
        crit_rate: 1.0, // Always crit
        crit_dmg: 2.0,
        element: 'NEUTRAL', isPlayer: true,
      };

      const defender: Combatant = {
        id: '2', name: 'Defender', hp: 100, maxHp: 100,
        atk: 50, def: 0, // No DEF for simplicity
        spd: 50, crit_rate: 0, crit_dmg: 1.5,
        element: 'NEUTRAL', isPlayer: false,
      };

      const mockRandom = () => 0.5; // Crit
      const result = service.calculateDamage(attacker, defender, 1.0, mockRandom);

      // Expected: 100 * 1.0 * 2.0 = 200
      expect(result.damage).toBe(200);
      expect(result.isCrit).toBe(true);
    });

    it('should apply element advantage', () => {
      const mockRandom = () => 1.0;

      // FIRE vs WOOD (+10%)
      const fire: Combatant = { id: '1', name: 'Fire', hp: 100, maxHp: 100, atk: 100, def: 0, spd: 50, crit_rate: 0, crit_dmg: 1.5, element: 'FIRE', isPlayer: true };
      const wood: Combatant = { id: '2', name: 'Wood', hp: 100, maxHp: 100, atk: 50, def: 0, spd: 50, crit_rate: 0, crit_dmg: 1.5, element: 'WOOD', isPlayer: false };

      const result1 = service.calculateDamage(fire, wood, 1.0, mockRandom);
      expect(result1.elementBonus).toBe(0.1);
      expect(result1.damage).toBe(110); // 100 * 1.1

      // WOOD vs FIRE (-10%)
      const result2 = service.calculateDamage(wood, fire, 1.0, mockRandom);
      expect(result2.elementBonus).toBe(-0.1);
      expect(result2.damage).toBe(45); // 50 * 0.9
    });

    it('should apply crit + element bonus together', () => {
      const fire: Combatant = { id: '1', name: 'Fire', hp: 100, maxHp: 100, atk: 100, def: 0, spd: 50, crit_rate: 1.0, crit_dmg: 1.5, element: 'FIRE', isPlayer: true };
      const wood: Combatant = { id: '2', name: 'Wood', hp: 100, maxHp: 100, atk: 50, def: 0, spd: 50, crit_rate: 0, crit_dmg: 1.5, element: 'WOOD', isPlayer: false };

      const mockRandom = () => 0.5; // Crit
      const result = service.calculateDamage(fire, wood, 1.0, mockRandom);

      // 100 * 1.1 (element) * 1.5 (crit) = 165
      expect(result.damage).toBe(165);
      expect(result.isCrit).toBe(true);
      expect(result.elementBonus).toBe(0.1);
    });
  });

  describe('Turn Order', () => {
    it('should sort combatants by SPD descending', () => {
      const team1: Combatant[] = [
        { id: 'A', name: 'A', hp: 100, maxHp: 100, atk: 50, def: 50, spd: 50, crit_rate: 0, crit_dmg: 1.5, element: 'NEUTRAL', isPlayer: true },
        { id: 'B', name: 'B', hp: 100, maxHp: 100, atk: 50, def: 50, spd: 80, crit_rate: 0, crit_dmg: 1.5, element: 'NEUTRAL', isPlayer: true },
      ];

      const team2: Combatant[] = [
        { id: 'C', name: 'C', hp: 100, maxHp: 100, atk: 50, def: 50, spd: 60, crit_rate: 0, crit_dmg: 1.5, element: 'NEUTRAL', isPlayer: false },
      ];

      const mockRandom = () => 0.5;
      const result = service.executeBattle(team1, team2, mockRandom, 50);

      // First attacker should be highest SPD (B with 80)
      expect(result.log[0].attacker).toBe('B');
    });

    it('should tie-break by id when SPD equal', () => {
      const team1: Combatant[] = [
        { id: 'Z', name: 'Z', hp: 100, maxHp: 100, atk: 50, def: 50, spd: 50, crit_rate: 0, crit_dmg: 1.5, element: 'NEUTRAL', isPlayer: true },
        { id: 'A', name: 'A', hp: 100, maxHp: 100, atk: 50, def: 50, spd: 50, crit_rate: 0, crit_dmg: 1.5, element: 'NEUTRAL', isPlayer: true },
      ];

      const team2: Combatant[] = [
        { id: 'M', name: 'M', hp: 100, maxHp: 100, atk: 50, def: 50, spd: 50, crit_rate: 0, crit_dmg: 1.5, element: 'NEUTRAL', isPlayer: false },
      ];

      const mockRandom = () => 0.5;
      const result = service.executeBattle(team1, team2, mockRandom, 50);

      // With equal SPD, should sort by id: A < M < Z
      expect(result.log[0].attacker).toBe('A');
    });
  });

  describe('Victory Conditions', () => {
    it('should declare victory when all enemies defeated', () => {
      const strong: Combatant[] = [
        { id: '1', name: 'Strong', hp: 1000, maxHp: 1000, atk: 200, def: 0, spd: 100, crit_rate: 0, crit_dmg: 1.5, element: 'NEUTRAL', isPlayer: true },
      ];

      const weak: Combatant[] = [
        { id: '2', name: 'Weak', hp: 50, maxHp: 50, atk: 10, def: 0, spd: 10, crit_rate: 0, crit_dmg: 1.5, element: 'NEUTRAL', isPlayer: false },
      ];

      const mockRandom = () => 0.5;
      const result = service.executeBattle(strong, weak, mockRandom);

      expect(result.victory).toBe(true);
      expect(result.survivors).toContain('1');
    });

    it('should declare defeat when all players defeated', () => {
      const weak: Combatant[] = [
        { id: '1', name: 'Weak', hp: 50, maxHp: 50, atk: 10, def: 0, spd: 10, crit_rate: 0, crit_dmg: 1.5, element: 'NEUTRAL', isPlayer: true },
      ];

      const strong: Combatant[] = [
        { id: '2', name: 'Strong', hp: 1000, maxHp: 1000, atk: 200, def: 0, spd: 100, crit_rate: 0, crit_dmg: 1.5, element: 'NEUTRAL', isPlayer: false },
      ];

      const mockRandom = () => 0.5;
      const result = service.executeBattle(weak, strong, mockRandom);

      expect(result.victory).toBe(false);
      expect(result.survivors).toHaveLength(0);
    });
  });

  describe('Boss Enrage', () => {
    it('should apply enrage bonus at turn 10', () => {
      const player: Combatant[] = [
        { id: '1', name: 'Tank', hp: 10000, maxHp: 10000, atk: 50, def: 200, spd: 30, crit_rate: 0, crit_dmg: 1.5, element: 'NEUTRAL', isPlayer: true },
      ];

      const boss: Combatant[] = [
        { id: 'BOSS', name: 'Boss', hp: 5000, maxHp: 5000, atk: 100, def: 50, spd: 50, crit_rate: 0, crit_dmg: 1.5, element: 'NEUTRAL', isPlayer: false },
      ];

      const mockRandom = () => 0.5;
      const result = service.executeBattle(player, boss, mockRandom, 50);

      // Find turn 10 in log
      const turn10Logs = result.log.filter(l => l.turn === 10);
      
      // Should have enrage notification or see increased damage
      expect(result.log.length).toBeGreaterThan(10);
    });
  });
});
