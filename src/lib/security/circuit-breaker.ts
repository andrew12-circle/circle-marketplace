// FILE: src/lib/security/circuit-breaker.ts

interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/**
 * Circuit breaker for fragile integrations
 */
export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private lastFailureTime = 0;
  private nextAttempt = 0;
  private successCount = 0;

  constructor(
    private name: string,
    private options: CircuitBreakerOptions = {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      monitoringPeriod: 10000 // 10 seconds
    }
  ) {}

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const canExecute = this.canExecute();
    
    if (!canExecute) {
      throw new Error(`Circuit breaker ${this.name} is OPEN`);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Check if execution is allowed
   */
  private canExecute(): boolean {
    const now = Date.now();

    switch (this.state) {
      case 'CLOSED':
        return true;
        
      case 'OPEN':
        if (now >= this.nextAttempt) {
          this.state = 'HALF_OPEN';
          this.successCount = 0;
          return true;
        }
        return false;
        
      case 'HALF_OPEN':
        return true;
        
      default:
        return false;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.failures = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      
      // If we have enough successful attempts, close the circuit
      if (this.successCount >= 3) {
        this.state = 'CLOSED';
        this.successCount = 0;
      }
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.options.resetTimeout;
    } else if (this.failures >= this.options.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.options.resetTimeout;
    }
  }

  /**
   * Get current circuit breaker status
   */
  getStatus(): {
    state: CircuitState;
    failures: number;
    lastFailureTime: number;
    nextAttempt: number;
  } {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
      nextAttempt: this.nextAttempt
    };
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    this.state = 'CLOSED';
    this.failures = 0;
    this.lastFailureTime = 0;
    this.nextAttempt = 0;
    this.successCount = 0;
  }

  /**
   * Manually trip the circuit breaker
   */
  trip(): void {
    this.state = 'OPEN';
    this.nextAttempt = Date.now() + this.options.resetTimeout;
  }
}

/**
 * Circuit breaker registry for managing multiple breakers
 */
export class CircuitBreakerRegistry {
  private breakers = new Map<string, CircuitBreaker>();

  /**
   * Get or create a circuit breaker
   */
  getBreaker(
    name: string, 
    options?: CircuitBreakerOptions
  ): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, options));
    }
    return this.breakers.get(name)!;
  }

  /**
   * Execute with circuit breaker
   */
  async execute<T>(
    name: string,
    fn: () => Promise<T>,
    options?: CircuitBreakerOptions
  ): Promise<T> {
    const breaker = this.getBreaker(name, options);
    return breaker.execute(fn);
  }

  /**
   * Get status of all breakers
   */
  getAllStatus(): Record<string, ReturnType<CircuitBreaker['getStatus']>> {
    const status: Record<string, ReturnType<CircuitBreaker['getStatus']>> = {};
    
    for (const [name, breaker] of this.breakers) {
      status[name] = breaker.getStatus();
    }
    
    return status;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  /**
   * Reset specific circuit breaker
   */
  reset(name: string): void {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.reset();
    }
  }
}

// Singleton registry
export const circuitBreakers = new CircuitBreakerRegistry();

// Common circuit breakers for typical integrations
export const stripeCircuitBreaker = circuitBreakers.getBreaker('stripe', {
  failureThreshold: 3,
  resetTimeout: 30000, // 30 seconds
  monitoringPeriod: 5000 // 5 seconds
});

export const emailCircuitBreaker = circuitBreakers.getBreaker('email', {
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
  monitoringPeriod: 10000 // 10 seconds
});

export const databaseCircuitBreaker = circuitBreakers.getBreaker('database', {
  failureThreshold: 10,
  resetTimeout: 30000, // 30 seconds
  monitoringPeriod: 5000 // 5 seconds
});