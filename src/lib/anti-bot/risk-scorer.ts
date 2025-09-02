// FILE: src/lib/anti-bot/risk-scorer.ts

export interface RiskFactors {
  requestBurst: number;
  apiOnlyAccess: number;
  recentLoginFailures: number;
  newAccount: number;
  suspiciousPaths: number;
  noPageViews: number;
  rapidActions: number;
  botUserAgent: number;
}

export interface RiskScore {
  score: number;
  level: 'low' | 'medium' | 'high' | 'severe';
  factors: RiskFactors;
  recommendation: 'allow' | 'captcha' | 'pow' | 'block';
}

class RiskScorer {
  private requestCounts = new Map<string, Array<{ timestamp: number; path: string }>>();
  private pageViews = new Map<string, number>();
  
  async calculateRisk(
    ip: string,
    userId?: string,
    userAgent?: string,
    path?: string,
    headers?: Record<string, string>
  ): Promise<RiskScore> {
    const factors: RiskFactors = {
      requestBurst: await this.calculateRequestBurst(ip),
      apiOnlyAccess: await this.calculateApiOnlyAccess(ip),
      recentLoginFailures: await this.getRecentLoginFailures(ip, userId),
      newAccount: await this.checkNewAccount(userId),
      suspiciousPaths: this.checkSuspiciousPaths(path),
      noPageViews: this.checkPageViews(ip),
      rapidActions: this.checkRapidActions(ip),
      botUserAgent: this.checkBotUserAgent(userAgent)
    };

    // Calculate weighted score
    const score = 
      factors.requestBurst * 25 +
      factors.apiOnlyAccess * 20 +
      factors.recentLoginFailures * 15 +
      factors.newAccount * 10 +
      factors.suspiciousPaths * 15 +
      factors.noPageViews * 10 +
      factors.rapidActions * 3 +
      factors.botUserAgent * 2;

    const level = this.getScoreLevel(score);
    const recommendation = this.getRecommendation(level, score);

    return { score, level, factors, recommendation };
  }

  private async calculateRequestBurst(ip: string): Promise<number> {
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    
    // Get current requests for this IP
    const requests = this.requestCounts.get(ip) || [];
    
    // Filter to recent requests
    const recentRequests = requests.filter(r => now - r.timestamp < windowMs);
    this.requestCounts.set(ip, recentRequests);

    // Score based on request count (exponential)
    if (recentRequests.length > 100) return 1.0;
    if (recentRequests.length > 50) return 0.8;
    if (recentRequests.length > 20) return 0.6;
    if (recentRequests.length > 10) return 0.3;
    return 0;
  }

  private async calculateApiOnlyAccess(ip: string): Promise<number> {
    const requests = this.requestCounts.get(ip) || [];
    const recentRequests = requests.filter(r => Date.now() - r.timestamp < 300000); // 5 min
    
    if (recentRequests.length === 0) return 0;
    
    const apiRequests = recentRequests.filter(r => 
      r.path.startsWith('/api/') || 
      r.path.startsWith('/supabase/functions/')
    );
    
    const ratio = apiRequests.length / recentRequests.length;
    
    if (ratio > 0.9) return 1.0;
    if (ratio > 0.7) return 0.7;
    if (ratio > 0.5) return 0.4;
    return 0;
  }

  private async getRecentLoginFailures(ip: string, userId?: string): Promise<number> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data } = await supabase
        .from('attack_logs')
        .select('id')
        .eq('ip_address', ip)
        .eq('attack_type', 'login_failure')
        .gte('created_at', new Date(Date.now() - 3600000).toISOString()) // 1 hour
        .limit(20);

      const failures = data?.length || 0;
      
      if (failures > 10) return 1.0;
      if (failures > 5) return 0.7;
      if (failures > 2) return 0.4;
      return 0;
    } catch {
      return 0;
    }
  }

  private async checkNewAccount(userId?: string): Promise<number> {
    if (!userId) return 0.1;
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('user_id', userId)
        .single();

      if (!data) return 0.1;
      
      const accountAge = Date.now() - new Date(data.created_at).getTime();
      const hoursOld = accountAge / (1000 * 60 * 60);
      
      if (hoursOld < 1) return 0.8;
      if (hoursOld < 24) return 0.5;
      if (hoursOld < 168) return 0.2; // 1 week
      return 0;
    } catch {
      return 0.1;
    }
  }

  private checkSuspiciousPaths(path?: string): number {
    if (!path) return 0;
    
    const suspiciousPaths = [
      '/admin', '/wp-admin', '/.env', '/config',
      '/phpmyadmin', '/xmlrpc.php', '/robots.txt',
      '/sitemap.xml', '/.well-known', '/api/auth/signin',
      '/api/auth/callback', '/debug'
    ];
    
    for (const suspicious of suspiciousPaths) {
      if (path.includes(suspicious)) {
        return 0.6;
      }
    }
    
    return 0;
  }

  private checkPageViews(ip: string): number {
    const pageViewCount = this.pageViews.get(ip) || 0;
    
    if (pageViewCount === 0) return 0.8;
    if (pageViewCount < 3) return 0.5;
    return 0;
  }

  private checkRapidActions(ip: string): number {
    const requests = this.requestCounts.get(ip) || [];
    const recentRequests = requests.filter(r => Date.now() - r.timestamp < 10000); // 10 sec
    
    if (recentRequests.length > 20) return 1.0;
    if (recentRequests.length > 10) return 0.7;
    if (recentRequests.length > 5) return 0.4;
    return 0;
  }

  private checkBotUserAgent(userAgent?: string): number {
    if (!userAgent) return 0.3;
    
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /curl/i, /wget/i, /python/i, /java/i,
      /go-http/i, /node/i, /axios/i, /fetch/i
    ];
    
    for (const pattern of botPatterns) {
      if (pattern.test(userAgent)) {
        return 0.8;
      }
    }
    
    return 0;
  }

  private getScoreLevel(score: number): 'low' | 'medium' | 'high' | 'severe' {
    if (score >= 90) return 'severe';
    if (score >= 75) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }

  private getRecommendation(level: string, score: number): 'allow' | 'captcha' | 'pow' | 'block' {
    switch (level) {
      case 'severe':
        return score > 95 ? 'block' : 'pow';
      case 'high':
        return 'pow';
      case 'medium':
        return 'captcha';
      default:
        return 'allow';
    }
  }

  // Track page view for IP
  trackPageView(ip: string) {
    const current = this.pageViews.get(ip) || 0;
    this.pageViews.set(ip, current + 1);
  }

  // Track request for IP
  trackRequest(ip: string, path: string) {
    const requests = this.requestCounts.get(ip) || [];
    requests.push({ timestamp: Date.now(), path });
    
    // Keep only recent requests
    const recentRequests = requests.filter(r => Date.now() - r.timestamp < 300000);
    this.requestCounts.set(ip, recentRequests);
  }
}

export const riskScorer = new RiskScorer();
