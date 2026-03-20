import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  cachePrices,
  getCachedPrice,
  getAllCachedPrices,
  isPriceStale,
  clearPriceCache,
  setMemoryCacheTtl,
} from "./cache";
import type { PriceData } from "./coingecko";

// Mock localStorage
let store: Record<string, string> = {};
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      store = Object.fromEntries(Object.entries(store).filter(([k]) => k !== key));
    }),
  },
  writable: true,
});

describe("price cache", () => {
  const samplePrices: PriceData[] = [
    { symbol: "ETH", usd: 2000, change24h: 3.5, lastUpdated: 1000 },
    { symbol: "SOL", usd: 100, change24h: -1.2, lastUpdated: 1000 },
  ];

  beforeEach(() => {
    clearPriceCache();
    store = {};
    setMemoryCacheTtl(30_000);
  });

  it("caches and retrieves prices", () => {
    cachePrices(samplePrices);
    const eth = getCachedPrice("ETH");
    expect(eth?.usd).toBe(2000);
    expect(eth?.symbol).toBe("ETH");
  });

  it("returns null for missing symbol", () => {
    expect(getCachedPrice("BTC")).toBeNull();
  });

  it("getAllCachedPrices returns all cached", () => {
    cachePrices(samplePrices);
    const all = getAllCachedPrices();
    expect(all).toHaveLength(2);
  });

  it("reports fresh prices as not stale", () => {
    cachePrices(samplePrices);
    expect(isPriceStale("ETH")).toBe(false);
  });

  it("reports missing prices as stale", () => {
    expect(isPriceStale("BTC")).toBe(true);
  });

  it("persists to localStorage", () => {
    cachePrices(samplePrices);
    expect(store.vaultview_price_cache).toBeDefined();
    const parsed = JSON.parse(store.vaultview_price_cache ?? "{}") as Record<string, unknown>;
    expect(parsed).toHaveProperty("ETH");
  });

  it("handles corrupted localStorage gracefully", () => {
    store.vaultview_price_cache = "not valid json";
    expect(getCachedPrice("ETH")).toBeNull();
  });
});
