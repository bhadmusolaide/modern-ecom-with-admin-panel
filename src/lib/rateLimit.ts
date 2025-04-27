/**
 * Enhanced rate limiter with sliding window algorithm and multiple limiters
 * 
 * In a production environment, you would use Redis or another distributed cache
 * for persistence across server instances.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
  firstRequestAt: number;
  lastRequestAt: number;
  attempts: number[];  // Timestamps of attempts for sliding window
}

interface RateLimitOptions {
  limit: number;
  windowMs: number;
  blockDurationMs?: number;
}

// Default rate limit settings
const DEFAULT_AUTH_LIMIT: RateLimitOptions = {
  limit: 5,                    // 5 attempts
  windowMs: 15 * 60 * 1000,    // per 15 minutes
  blockDurationMs: 60 * 60 * 1000 // Block for 1 hour after exceeding limit
};

const DEFAULT_API_LIMIT: RateLimitOptions = {
  limit: 100,                  // 100 requests
  windowMs: 60 * 1000,         // per minute
  blockDurationMs: 5 * 60 * 1000 // Block for 5 minutes after exceeding limit
};

// Separate limiters for different types of requests
const limiters: Record<string, Map<string, RateLimitRecord>> = {
  ip: new Map(),
  email: new Map(),
  login: new Map(),
  signup: new Map(),
  passwordReset: new Map(),
  adminLogin: new Map(),
  api: new Map()
};

// Clean up old records periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  Object.values(limiters).forEach(limiter => {
    limiter.forEach((record, key) => {
      if (now > record.resetAt + (24 * 60 * 60 * 1000)) { // Remove after 24 hours
        limiter.delete(key);
      }
    });
  });
}, 60 * 60 * 1000); // Run cleanup every hour

/**
 * Check if a key is rate limited using sliding window algorithm
 * 
 * @param limiterType - The type of limiter to use
 * @param key - The key to check (IP, email, etc.)
 * @param options - Rate limit options
 * @returns Object with isLimited flag and other rate limit info
 */
export function checkRateLimit(
  limiterType: string,
  key: string,
  options: RateLimitOptions = DEFAULT_AUTH_LIMIT
): { 
  isLimited: boolean;
  remaining: number;
  resetAt: number | null;
  retryAfter: number | null;
} {
  const limiter = limiters[limiterType] || limiters.ip;
  const now = Date.now();
  const record = limiter.get(key);
  
  // If no record exists, create a new one
  if (!record) {
    limiter.set(key, { 
      count: 1, 
      resetAt: now + options.windowMs,
      firstRequestAt: now,
      lastRequestAt: now,
      attempts: [now]
    });
    
    return {
      isLimited: false,
      remaining: options.limit - 1,
      resetAt: now + options.windowMs,
      retryAfter: null
    };
  }
  
  // Check if currently in a blocked state
  if (record.count > options.limit) {
    const blockDuration = options.blockDurationMs || options.windowMs;
    const blockEndTime = record.lastRequestAt + blockDuration;
    
    if (now < blockEndTime) {
      return {
        isLimited: true,
        remaining: 0,
        resetAt: blockEndTime,
        retryAfter: Math.ceil((blockEndTime - now) / 1000)
      };
    }
    
    // Block duration has passed, reset the record
    limiter.set(key, { 
      count: 1, 
      resetAt: now + options.windowMs,
      firstRequestAt: now,
      lastRequestAt: now,
      attempts: [now]
    });
    
    return {
      isLimited: false,
      remaining: options.limit - 1,
      resetAt: now + options.windowMs,
      retryAfter: null
    };
  }
  
  // Sliding window implementation
  // Remove attempts outside the current window
  record.attempts = record.attempts.filter(time => now - time < options.windowMs);
  
  // Add current attempt
  record.attempts.push(now);
  record.lastRequestAt = now;
  record.count = record.attempts.length;
  
  // Calculate new reset time based on the sliding window
  const oldestAttemptInWindow = record.attempts[0];
  record.resetAt = oldestAttemptInWindow + options.windowMs;
  
  // Update the record
  limiter.set(key, record);
  
  // Check if limit exceeded
  const isLimited = record.count > options.limit;
  
  return {
    isLimited,
    remaining: Math.max(0, options.limit - record.count),
    resetAt: record.resetAt,
    retryAfter: isLimited ? Math.ceil((record.resetAt - now) / 1000) : null
  };
}

/**
 * Rate limit middleware for authentication endpoints
 * 
 * @param request - The incoming request
 * @param limiterType - The type of limiter to use
 * @param key - The key to check (IP, email, etc.)
 * @param options - Rate limit options
 * @returns Object with isLimited flag and headers to add to the response
 */
export function rateLimitAuth(
  request: Request,
  limiterType: string = 'login',
  key?: string,
  options: RateLimitOptions = DEFAULT_AUTH_LIMIT
): { 
  isLimited: boolean;
  headers: Record<string, string>;
} {
  // Get IP address from request
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown-ip';
  
  // Use provided key or fall back to IP
  const limitKey = key || ip;
  
  // Check rate limit
  const result = checkRateLimit(limiterType, limitKey, options);
  
  // Prepare headers for the response
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': options.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
  };
  
  if (result.resetAt) {
    headers['X-RateLimit-Reset'] = Math.ceil(result.resetAt / 1000).toString();
  }
  
  if (result.retryAfter !== null) {
    headers['Retry-After'] = result.retryAfter.toString();
  }
  
  return {
    isLimited: result.isLimited,
    headers
  };
}

/**
 * Rate limit middleware for API endpoints
 * 
 * @param request - The incoming request
 * @returns Object with isLimited flag and headers to add to the response
 */
export function rateLimitApi(request: Request): { 
  isLimited: boolean;
  headers: Record<string, string>;
} {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown-ip';
             
  return rateLimitAuth(request, 'api', ip, DEFAULT_API_LIMIT);
}

/**
 * Reset rate limit for a specific key and limiter type
 * 
 * @param limiterType - The type of limiter
 * @param key - The key to reset
 */
export function resetRateLimit(limiterType: string, key: string): void {
  const limiter = limiters[limiterType];
  if (limiter) {
    limiter.delete(key);
  }
}
