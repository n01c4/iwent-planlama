import { env } from '../config/index.js';
import * as crypto from 'crypto';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * Simple in-memory cache for NLP search
 * Can be replaced with Redis for production scaling
 */
class NLPCache {
  private intentCache: Map<string, CacheEntry<unknown>> = new Map();
  private resultsCache: Map<string, CacheEntry<unknown>> = new Map();
  private readonly intentTTL: number;
  private readonly resultsTTL: number;

  constructor() {
    // Intent cache: 1 hour (queries don't change)
    this.intentTTL = env.NLP_SEARCH_CACHE_TTL * 1000; // Convert to ms
    // Results cache: 5 minutes (events change more frequently)
    this.resultsTTL = 5 * 60 * 1000;

    // Clean expired entries every 10 minutes
    setInterval(() => this.cleanup(), 10 * 60 * 1000);
  }

  /**
   * Generate cache key from query string
   */
  private hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex').substring(0, 16);
  }

  /**
   * Get intent from cache
   */
  getIntent<T>(query: string): T | null {
    const key = `intent:${this.hashKey(query.toLowerCase().trim())}`;
    return this.get<T>(this.intentCache, key);
  }

  /**
   * Set intent in cache
   */
  setIntent<T>(query: string, intent: T): void {
    const key = `intent:${this.hashKey(query.toLowerCase().trim())}`;
    this.set(this.intentCache, key, intent, this.intentTTL);
  }

  /**
   * Get search results from cache
   */
  getResults<T>(query: string, filters?: Record<string, unknown>): T | null {
    const filterStr = filters ? JSON.stringify(filters) : '';
    const key = `results:${this.hashKey(query.toLowerCase().trim() + filterStr)}`;
    return this.get<T>(this.resultsCache, key);
  }

  /**
   * Set search results in cache
   */
  setResults<T>(query: string, results: T, filters?: Record<string, unknown>): void {
    const filterStr = filters ? JSON.stringify(filters) : '';
    const key = `results:${this.hashKey(query.toLowerCase().trim() + filterStr)}`;
    this.set(this.resultsCache, key, results, this.resultsTTL);
  }

  /**
   * Invalidate all results cache (called when events update)
   */
  invalidateResults(): void {
    this.resultsCache.clear();
  }

  /**
   * Get cache stats
   */
  getStats(): { intentCacheSize: number; resultsCacheSize: number } {
    return {
      intentCacheSize: this.intentCache.size,
      resultsCacheSize: this.resultsCache.size,
    };
  }

  /**
   * Generic get from cache
   */
  private get<T>(cache: Map<string, CacheEntry<unknown>>, key: string): T | null {
    const entry = cache.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Generic set in cache
   */
  private set<T>(cache: Map<string, CacheEntry<unknown>>, key: string, data: T, ttl: number): void {
    cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    });
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();

    for (const [key, entry] of this.intentCache.entries()) {
      if (now > entry.expiresAt) {
        this.intentCache.delete(key);
      }
    }

    for (const [key, entry] of this.resultsCache.entries()) {
      if (now > entry.expiresAt) {
        this.resultsCache.delete(key);
      }
    }
  }
}

export const nlpCache = new NLPCache();
