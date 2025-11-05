import { Injectable } from '@nestjs/common';
import { gameConfig } from 'src/config/game.config';

export interface Combatant {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  crit_rate: number;
  crit_dmg: number;
  element: string;
  skills?: Array<{ name: string; dmg_mult: number; effect?: string }>;
  isPlayer: boolean;
}

export interface TurnLog {
  turn: number;
  attacker: string;
  defender: string;
  damage: number;
  isCrit: boolean;
  elementBonus: number;
  defenderHp: number;
}

export interface BattleResult {
  victory: boolean;
  turns: number;
  log: TurnLog[];
  survivors: string[];
}

@Injectable()
export class BattleService {
  /**
   * Calculate damage mitigation từ DEF
   */
  calculateMitigation(def: number): number {
    return def / (def + gameConfig.combat.defenseConstant);
  }

  /**
   * Calculate element advantage bonus
   */
  getElementBonus(attackerElement: string, defenderElement: string): number {
    const advantage =
      gameConfig.elementAdvantage[attackerElement as keyof typeof gameConfig.elementAdvantage];
    if (advantage === defenderElement) return gameConfig.elementBonus; // +10%

    // Check reverse (defender có lợi thế)
    const defenderAdvantage =
      gameConfig.elementAdvantage[defenderElement as keyof typeof gameConfig.elementAdvantage];
    if (defenderAdvantage === attackerElement) return -gameConfig.elementBonus; // -10%

    return 0; // Neutral
  }

  /**
   * Calculate damage cho 1 hit
   */
  calculateDamage(
    attacker: Combatant,
    defender: Combatant,
    skillMult: number,
    random: () => number,
  ): { damage: number; isCrit: boolean; elementBonus: number } {
    const mitigation = this.calculateMitigation(defender.def);
    const elementBonus = this.getElementBonus(attacker.element, defender.element);

    // Roll crit
    const isCrit = random() < attacker.crit_rate;
    const critMult = isCrit ? attacker.crit_dmg : 1.0;

    // Final damage
    const baseDmg = attacker.atk * skillMult;
    const dmgAfterElement = baseDmg * (1 + elementBonus);
    const dmgAfterCrit = dmgAfterElement * critMult;
    const finalDmg = dmgAfterCrit * (1 - mitigation);

    return {
      damage: Math.max(1, Math.floor(finalDmg)),
      isCrit,
      elementBonus,
    };
  }

  /**
   * Execute turn-based battle
   */
  executeBattle(
    playerTeam: Combatant[],
    enemyTeam: Combatant[],
    random: () => number,
    maxTurns: number = 50,
  ): BattleResult {
    const allCombatants = [...playerTeam, ...enemyTeam];

    // Sort by SPD (desc), tie-break by id
    allCombatants.sort((a, b) => {
      if (b.spd !== a.spd) return b.spd - a.spd;
      return a.id.localeCompare(b.id);
    });

    const log: TurnLog[] = [];
    let turn = 0;

    while (turn < maxTurns) {
      turn++;

      // Boss enrage
      if (turn === gameConfig.combat.enrageTurn) {
        enemyTeam.forEach((e) => {
          e.atk *= 1 + gameConfig.combat.enrageBonus;
        });
        log.push({
          turn,
          attacker: 'SYSTEM',
          defender: 'BOSS',
          damage: 0,
          isCrit: false,
          elementBonus: 0,
          defenderHp: 0,
        } as any);
      }

      for (const combatant of allCombatants) {
        if (combatant.hp <= 0) continue;

        // Chọn target (random từ team đối phương còn sống)
        const targets = combatant.isPlayer
          ? enemyTeam.filter((e) => e.hp > 0)
          : playerTeam.filter((p) => p.hp > 0);

        if (targets.length === 0) break;

        const target = targets[Math.floor(random() * targets.length)];

        // Chọn skill (random hoặc basic attack)
        const skill =
          combatant.skills && combatant.skills.length > 0
            ? combatant.skills[Math.floor(random() * combatant.skills.length)]
            : { name: 'Attack', dmg_mult: 1.0 };

        const { damage, isCrit, elementBonus } = this.calculateDamage(
          combatant,
          target,
          skill.dmg_mult,
          random,
        );

        target.hp -= damage;

        log.push({
          turn,
          attacker: combatant.name,
          defender: target.name,
          damage,
          isCrit,
          elementBonus,
          defenderHp: Math.max(0, target.hp),
        });

        // Check win condition
        const playersAlive = playerTeam.filter((p) => p.hp > 0).length;
        const enemiesAlive = enemyTeam.filter((e) => e.hp > 0).length;

        if (enemiesAlive === 0) {
          return {
            victory: true,
            turns: turn,
            log,
            survivors: playerTeam.filter((p) => p.hp > 0).map((p) => p.id),
          };
        }

        if (playersAlive === 0) {
          return {
            victory: false,
            turns: turn,
            log,
            survivors: [],
          };
        }
      }
    }

    // Timeout = defeat
    return {
      victory: false,
      turns: maxTurns,
      log,
      survivors: [],
    };
  }

  /**
   * Parse combatant từ user_creature data
   */
  parseCombatant(
    id: number,
    name: string,
    baseStats: any,
    ivRolls: any,
    level: number,
    element: string,
    skills: any,
    isPlayer: boolean,
  ): Combatant {
    // Calculate stats với IV & level scaling
    const hp = Math.floor((baseStats.hp + (ivRolls?.hp || 0)) * (1 + level * 0.1));
    const atk = Math.floor((baseStats.atk + (ivRolls?.atk || 0)) * (1 + level * 0.05));
    const def = Math.floor((baseStats.def + (ivRolls?.def || 0)) * (1 + level * 0.05));
    const spd = baseStats.spd + (ivRolls?.spd || 0);

    return {
      id: `${id}`,
      name,
      hp,
      maxHp: hp,
      atk,
      def,
      spd,
      crit_rate: baseStats.crit_rate || 0.05,
      crit_dmg: baseStats.crit_dmg || 1.5,
      element,
      skills,
      isPlayer,
    };
  }
}
