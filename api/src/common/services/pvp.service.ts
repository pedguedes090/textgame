import { Injectable } from '@nestjs/common';
import { gameConfig } from 'src/config/game.config';

export interface EloUpdate {
  playerA: { newRating: number; delta: number };
  playerB: { newRating: number; delta: number };
}

@Injectable()
export class PvpService {
  /**
   * Calculate Elo expected score
   */
  private expectedScore(ratingA: number, ratingB: number): number {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  }

  /**
   * Calculate Elo rating change
   */
  calculateElo(
    ratingA: number,
    ratingB: number,
    result: 'WIN_A' | 'WIN_B' | 'DRAW',
  ): EloUpdate {
    const expectedA = this.expectedScore(ratingA, ratingB);
    const expectedB = 1 - expectedA;

    let scoreA = 0.5;
    let scoreB = 0.5;

    if (result === 'WIN_A') {
      scoreA = 1;
      scoreB = 0;
    } else if (result === 'WIN_B') {
      scoreA = 0;
      scoreB = 1;
    }

    const deltaA = Math.round(gameConfig.pvp.kFactor * (scoreA - expectedA));
    const deltaB = Math.round(gameConfig.pvp.kFactor * (scoreB - expectedB));

    return {
      playerA: { newRating: ratingA + deltaA, delta: deltaA },
      playerB: { newRating: ratingB + deltaB, delta: deltaB },
    };
  }

  /**
   * Mock matchmaking: tìm đối thủ gần rating (trong production dùng queue Redis)
   */
  async findOpponent(userId: number, rating: number): Promise<number | null> {
    // TODO: Implement với Redis sorted set để queue
    // Tạm thời return mock opponent ID
    return userId + 1000; // Mock
  }
}
