// FILE: src/lib/anti-bot/proof-of-work.ts

export interface PowChallenge {
  challengeId: string;
  difficulty: number;
  targetHash: string;
  expiresAt: number;
}

export interface PowSolution {
  challengeId: string;
  nonce: string;
  hash: string;
}

export interface WorkToken {
  token: string;
  expiresAt: number;
}

class ProofOfWork {
  // Generate challenge on server
  async generateChallenge(difficulty: number = 20): Promise<PowChallenge> {
    const challengeId = this.generateId();
    const targetHash = this.generateTarget(difficulty);
    const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes

    return {
      challengeId,
      difficulty,
      targetHash,
      expiresAt
    };
  }

  // Solve challenge on client
  async solveChallenge(challenge: PowChallenge): Promise<PowSolution | null> {
    const startTime = Date.now();
    const timeoutMs = 5 * 60 * 1000; // 5 minute timeout
    
    let nonce = 0;
    const encoder = new TextEncoder();

    while (Date.now() - startTime < timeoutMs) {
      const input = `${challenge.challengeId}:${nonce}`;
      const data = encoder.encode(input);
      
      try {
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = new Uint8Array(hashBuffer);
        const hashHex = Array.from(hashArray)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        if (this.isValidSolution(hashHex, challenge.difficulty)) {
          return {
            challengeId: challenge.challengeId,
            nonce: nonce.toString(),
            hash: hashHex
          };
        }

        nonce++;
        
        // Yield control occasionally to prevent blocking
        if (nonce % 1000 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      } catch (error) {
        console.error('Error during PoW solving:', error);
        return null;
      }
    }

    console.warn('PoW solving timed out');
    return null;
  }

  // Verify solution on server
  async verifySolution(solution: PowSolution, challenge: PowChallenge): Promise<boolean> {
    try {
      const input = `${solution.challengeId}:${solution.nonce}`;
      const encoder = new TextEncoder();
      const data = encoder.encode(input);
      
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = new Uint8Array(hashBuffer);
      const hashHex = Array.from(hashArray)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      return hashHex === solution.hash && 
             this.isValidSolution(hashHex, challenge.difficulty) &&
             Date.now() < challenge.expiresAt;
    } catch (error) {
      console.error('Error verifying PoW solution:', error);
      return false;
    }
  }

  // Generate work token after successful verification
  async generateWorkToken(): Promise<WorkToken> {
    const token = this.generateId() + '.' + this.generateId();
    const expiresAt = Date.now() + (30 * 60 * 1000); // 30 minutes

    return { token, expiresAt };
  }

  private generateId(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  }

  private generateTarget(difficulty: number): string {
    const zeros = '0'.repeat(Math.floor(difficulty / 4));
    const remainder = difficulty % 4;
    
    if (remainder === 0) {
      return zeros;
    }
    
    // For partial hex digits, calculate the maximum allowed value
    const maxValue = Math.pow(16, 4 - remainder) - 1;
    const hexDigit = maxValue.toString(16);
    
    return zeros + hexDigit;
  }

  private isValidSolution(hash: string, difficulty: number): boolean {
    const zeros = Math.floor(difficulty / 4);
    const remainder = difficulty % 4;
    
    // Check leading zeros
    if (!hash.startsWith('0'.repeat(zeros))) {
      return false;
    }
    
    // Check partial hex digit if needed
    if (remainder > 0) {
      const nextDigit = hash[zeros];
      const maxValue = Math.pow(16, 4 - remainder) - 1;
      const digitValue = parseInt(nextDigit, 16);
      
      return digitValue <= maxValue;
    }
    
    return true;
  }

  // Client-side helper to get estimated solve time
  getEstimatedSolveTime(difficulty: number): number {
    // Very rough estimation based on difficulty
    // Actual time varies greatly based on hardware
    const baseTime = 1000; // 1 second for difficulty 16
    const multiplier = Math.pow(2, Math.max(0, difficulty - 16));
    
    return Math.min(baseTime * multiplier, 300000); // Cap at 5 minutes
  }
}

export const proofOfWork = new ProofOfWork();