import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class RngService {
  /**
   * Generate seed commit (hash) trước khi roll
   */
  generateCommit(serverSeed: string): string {
    return createHash('sha256').update(serverSeed).digest('hex');
  }

  /**
   * Tạo server seed ngẫu nhiên
   */
  generateServerSeed(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Combine client + server seed để tạo deterministic random
   */
  combinedSeed(clientSeed: string, serverSeed: string): string {
    return createHash('sha256')
      .update(clientSeed + serverSeed)
      .digest('hex');
  }

  /**
   * Tạo số random từ combined seed + nonce
   */
  rollNumber(combined: string, nonce: number, max: number): number {
    const hash = createHash('sha256')
      .update(combined + nonce.toString())
      .digest('hex');
    const value = parseInt(hash.substring(0, 8), 16);
    return value % max;
  }

  /**
   * Verify proof: client có thể check server_seed_reveal hash == commit
   */
  verifyProof(commit: string, reveal: string): boolean {
    return this.generateCommit(reveal) === commit;
  }

  /**
   * Generate random float [0, 1) từ seed
   */
  rollFloat(combined: string, nonce: number): number {
    const hash = createHash('sha256')
      .update(combined + nonce.toString())
      .digest('hex');
    const value = parseInt(hash.substring(0, 13), 16); // 13 hex = ~52 bits
    return value / 0x10000000000000; // 2^52
  }
}
