import { z } from "zod";
import type { PriceData } from "./coingecko";

const STORAGE_KEY = "vaultview_price_cache";
const DEFAULT_TTL_MS = 300_000; // 5 minutes for localStorage fallback

const cachedPriceSchema = z.object({
  symbol: z.string(),
  usd: z.number(),
  change24h: z.number().nullable(),
  lastUpdated: z.number(),
  cachedAt: z.number(),
});

const priceCacheSchema = z.record(z.string(), cachedPriceSchema);

type CachedPrice = z.infer<typeof cachedPriceSchema>;

/** In-memory cache with TTL */
const memoryCache = new Map<string, CachedPrice>();
let memoryCacheTtlMs = 30_000; // 30 seconds

/** Set the in-memory cache TTL. */
export function setMemoryCacheTtl(ttlMs: number): void {
  memoryCacheTtlMs = ttlMs;
}

/** Update the cache with fresh price data. */
export function cachePrices(prices: PriceData[]): void {
  const now = Date.now();

  for (const price of prices) {
    const cached: CachedPrice = {
      ...price,
      cachedAt: now,
    };
    memoryCache.set(price.symbol, cached);
  }

  persistToLocalStorage();
}

/** Get a cached price. Returns null if expired or missing. */
export function getCachedPrice(symbol: string): PriceData | null {
  const now = Date.now();

  // Try memory cache first
  const memCached = memoryCache.get(symbol);
  if (memCached && now - memCached.cachedAt < memoryCacheTtlMs) {
    return {
      symbol: memCached.symbol,
      usd: memCached.usd,
      change24h: memCached.change24h,
      lastUpdated: memCached.lastUpdated,
    };
  }

  // Fall back to localStorage
  const stored = loadFromLocalStorage();
  const lsCached = stored[symbol];
  if (lsCached && now - lsCached.cachedAt < DEFAULT_TTL_MS) {
    // Promote to memory cache
    memoryCache.set(symbol, lsCached);
    return {
      symbol: lsCached.symbol,
      usd: lsCached.usd,
      change24h: lsCached.change24h,
      lastUpdated: lsCached.lastUpdated,
    };
  }

  return null;
}

/** Get all cached prices (even stale ones, for display with stale indicators). */
export function getAllCachedPrices(): PriceData[] {
  // Merge memory and localStorage, memory takes precedence
  const stored = loadFromLocalStorage();
  const merged = new Map<string, CachedPrice>();

  for (const [key, value] of Object.entries(stored)) {
    merged.set(key, value);
  }
  for (const [key, value] of memoryCache) {
    merged.set(key, value);
  }

  return Array.from(merged.values()).map((c) => ({
    symbol: c.symbol,
    usd: c.usd,
    change24h: c.change24h,
    lastUpdated: c.lastUpdated,
  }));
}

/** Check if a cached price is stale (older than memory TTL). */
export function isPriceStale(symbol: string): boolean {
  const cached = memoryCache.get(symbol);
  if (!cached) return true;
  return Date.now() - cached.cachedAt >= memoryCacheTtlMs;
}

/** Get the age of a cached price in seconds. */
export function getPriceCacheAge(symbol: string): number | null {
  const cached = memoryCache.get(symbol);
  if (!cached) return null;
  return Math.round((Date.now() - cached.cachedAt) / 1000);
}

/** Clear all caches. */
export function clearPriceCache(): void {
  memoryCache.clear();
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage may be unavailable
  }
}

function persistToLocalStorage(): void {
  try {
    const data: Record<string, CachedPrice> = {};
    for (const [key, value] of memoryCache) {
      data[key] = value;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage may be full or unavailable — non-critical
  }
}

function loadFromLocalStorage(): Record<string, CachedPrice> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const json: unknown = JSON.parse(raw);
    const parsed = priceCacheSchema.safeParse(json);
    if (!parsed.success) {
      // Corrupted cache — remove it
      localStorage.removeItem(STORAGE_KEY);
      return {};
    }

    return parsed.data;
  } catch {
    return {};
  }
}
