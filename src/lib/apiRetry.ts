export interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryCondition?: (error: any) => boolean;
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryCondition: (error: any) => {
    // Retry on network errors and 5xx server errors
    if (!error.response) return true;
    const status = error.response?.status;
    return status >= 500 && status < 600;
  }
};

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  let lastError: any;
  let delay = finalConfig.initialDelay;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === finalConfig.maxRetries) {
        throw error;
      }

      if (!finalConfig.retryCondition(error)) {
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * finalConfig.backoffMultiplier, finalConfig.maxDelay);
    }
  }

  throw lastError;
}

export function isNetworkError(error: any): boolean {
  return (
    !error.response ||
    error.message === 'Network Error' ||
    error.message === 'Failed to fetch' ||
    error.code === 'ECONNABORTED'
  );
}

export function getErrorMessage(error: any): string {
  if (isNetworkError(error)) {
    return 'Network error. Please check your connection and try again.';
  }

  if (error.response) {
    const status = error.response.status;
    switch (status) {
      case 400:
        return error.response.data?.message || 'Invalid request. Please check your input.';
      case 401:
        return 'Authentication required. Please log in.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'A conflict occurred. The resource may already exist.';
      case 413:
        return 'The file is too large. Please try a smaller file.';
      case 422:
        return error.response.data?.message || 'Validation failed. Please check your input.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Please try again later.';
      case 503:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return error.response.data?.message || `An error occurred (${status})`;
    }
  }

  return error.message || 'An unexpected error occurred';
}

/**
 * Determine if an error should trigger a retry
 */
export function shouldRetry(error: any, attempt: number, maxRetries: number): boolean {
  // Don't retry if we've exhausted attempts
  if (attempt >= maxRetries) return false;

  // Always retry network errors
  if (isNetworkError(error)) return true;

  // Retry on specific status codes
  if (error.response) {
    const status = error.response.status;
    // Retry on 5xx server errors, 408 timeout, 429 rate limit
    return status >= 500 || status === 408 || status === 429;
  }

  return false;
}

/**
 * Circuit Breaker to prevent cascading failures
 * Opens after a threshold of failures, half-opens after a timeout, closes on success
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime: number | null = null;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 60 seconds
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.lastFailureTime && Date.now() - this.lastFailureTime >= this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN. Service temporarily unavailable.');
      }
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

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      console.warn(`Circuit breaker opened after ${this.failures} failures`);
    }
  }

  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    return this.state;
  }

  reset(): void {
    this.failures = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED';
  }
}

// Global circuit breaker for API calls
export const apiCircuitBreaker = new CircuitBreaker(5, 60000);
