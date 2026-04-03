/**
 * Token bucket rate limiter for API calls
 * Ensures requests are spaced out to avoid rate limit errors
 */
class RateLimiter {
  private tokens: number
  private lastRefill: number
  private readonly maxTokens: number
  private readonly refillRate: number // tokens per second

  constructor(maxTokens: number = 1, refillRate: number = 0.5) {
    this.tokens = maxTokens
    this.lastRefill = Date.now()
    this.maxTokens = maxTokens
    this.refillRate = refillRate
  }

  /**
   * Wait for a token to become available
   * This method blocks until a token is available
   */
  async waitForToken(): Promise<void> {
    this.refill()

    if (this.tokens < 1) {
      const waitTime = ((1 - this.tokens) / this.refillRate) * 1000
      await new Promise((resolve) => setTimeout(resolve, waitTime))
      this.refill()
      this.tokens = Math.max(0, this.tokens - 1)
    } else {
      this.tokens -= 1
    }
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refill(): void {
    const now = Date.now()
    const elapsed = (now - this.lastRefill) / 1000
    const newTokens = elapsed * this.refillRate
    this.tokens = Math.min(this.maxTokens, this.tokens + newTokens)
    this.lastRefill = now
  }

  /**
   * Get current token count (for debugging)
   */
  getTokens(): number {
    this.refill()
    return this.tokens
  }
}

// Singleton instance for auto-fetch rate limiting
// 1 request per 2 seconds (0.5 per second)
export const autoFetchRateLimiter = new RateLimiter(1, 0.5)

/**
 * Delay helper for simple wait operations
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
