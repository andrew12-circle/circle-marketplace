// FILE: src/lib/security/risk-scorer.ts

interface RiskFactors {
  botUserAgent?: boolean;
  highRequestRate?: boolean;
  suspiciousPath?: boolean;
  knownBadIP?: boolean;
  newUser?: boolean;
}

interface RiskResult {
  score: number;
  factors: RiskFactors;
  recommendation: 'allow' | 'captcha' | 'pow' | 'block';
}

class RiskScorer {
  private suspiciousPaths = [
    '/admin',
    '/api/payments',
    '/api/auth',
    '/.env',
    '/wp-admin',
    '/phpmyadmin'
  ];

  private botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i
  ];

  async calculateRisk(
    ip: string,
    userId?: string,
    userAgent?: string,
    path?: string
  ): Promise<RiskResult> {
    let score = 0;
    const factors: RiskFactors = {};

    // Check for bot user agent
    if (userAgent && this.botPatterns.some(pattern => pattern.test(userAgent))) {
      score += 30;
      factors.botUserAgent = true;
    }

    // Check for suspicious paths
    if (path && this.suspiciousPaths.some(suspPath => path.startsWith(suspPath))) {
      score += 25;
      factors.suspiciousPath = true;
    }

    // Check request rate (simplified)
    const recentRequests = await this.getRecentRequestCount(ip);
    if (recentRequests > 20) {
      score += 40;
      factors.highRequestRate = true;
    }

    // Check against known bad IPs (would integrate with threat intel)
    if (await this.isKnownBadIP(ip)) {
      score += 50;
      factors.knownBadIP = true;
    }

    // New user check
    if (!userId) {
      score += 10;
      factors.newUser = true;
    }

    // Determine recommendation
    let recommendation: RiskResult['recommendation'] = 'allow';
    if (score >= 80) {
      recommendation = 'block';
    } else if (score >= 60) {
      recommendation = 'pow';
    } else if (score >= 30) {
      recommendation = 'captcha';
    }

    return {
      score,
      factors,
      recommendation
    };
  }

  private async getRecentRequestCount(ip: string): Promise<number> {
    // In production, query Redis or database for recent request count
    // For now, return random for demo
    return Math.floor(Math.random() * 30);
  }

  private async isKnownBadIP(ip: string): Promise<boolean> {
    // In production, check against threat intelligence feeds
    // For now, simulate some bad IPs
    const knownBadIPs = ['192.168.1.100', '10.0.0.1'];
    return knownBadIPs.includes(ip);
  }
}

export const riskScorer = new RiskScorer();