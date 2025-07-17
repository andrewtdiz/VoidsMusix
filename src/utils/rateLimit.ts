interface RateLimitEntry {
  count: number;
  firstRequestTime: number;
}

export class RateLimiter {
  private static userRequests: Map<string, RateLimitEntry> = new Map();
  private static readonly WINDOW_MS = 60000; // 60 seconds
  private static readonly MAX_REQUESTS = 2;

  static isRateLimited(userId: string): boolean {
    const now = Date.now();
    const entry = this.userRequests.get(userId);

    if (!entry) {
      return false;
    }

    // Check if we're still within the time window
    if (now - entry.firstRequestTime < this.WINDOW_MS) {
      // Within window, check if user has exceeded limit
      return entry.count >= this.MAX_REQUESTS;
    } else {
      // Outside window, not rate limited
      return false;
    }
  }

  static trackRequest(userId: string): void {
    const now = Date.now();
    const entry = this.userRequests.get(userId);

    if (!entry) {
      // First request for this user
      this.userRequests.set(userId, {
        count: 1,
        firstRequestTime: now,
      });
      return;
    }

    // Check if we're still within the time window
    if (now - entry.firstRequestTime < this.WINDOW_MS) {
      // Within window, increment count
      entry.count++;
    } else {
      // Outside window, reset
      this.userRequests.set(userId, {
        count: 1,
        firstRequestTime: now,
      });
    }
  }

  static getTimeRemaining(userId: string): number {
    const entry = this.userRequests.get(userId);
    if (!entry) return 0;

    const now = Date.now();
    const timeElapsed = now - entry.firstRequestTime;
    const timeRemaining = this.WINDOW_MS - timeElapsed;

    return Math.max(0, timeRemaining);
  }

  static getRemainingRequests(userId: string): number {
    const entry = this.userRequests.get(userId);
    if (!entry) return this.MAX_REQUESTS;

    const now = Date.now();
    if (now - entry.firstRequestTime >= this.WINDOW_MS) {
      return this.MAX_REQUESTS;
    }

    return Math.max(0, this.MAX_REQUESTS - entry.count);
  }

  // Clean up old entries to prevent memory leaks
  static cleanup(): void {
    const now = Date.now();
    for (const [userId, entry] of this.userRequests.entries()) {
      if (now - entry.firstRequestTime >= this.WINDOW_MS) {
        this.userRequests.delete(userId);
      }
    }
  }
}
