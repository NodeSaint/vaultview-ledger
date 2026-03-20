import { describe, it, expect } from "vitest";
import { aggregatePortfolio, formatUsd, formatPercent } from "./aggregator";
import type { AssetBalance } from "@/lib/dmk/types";
import type { PriceData } from "@/lib/prices";

describe("aggregatePortfolio", () => {
  const balances: AssetBalance[] = [
    { chain: "ethereum", symbol: "ETH", name: "Ethereum", balance: "2.5", contractAddress: null, decimals: 18 },
    { chain: "solana", symbol: "SOL", name: "Solana", balance: "100", contractAddress: null, decimals: 9 },
    { chain: "ethereum", symbol: "USDC", name: "USD Coin", balance: "1000", contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
  ];

  const prices: PriceData[] = [
    { symbol: "ETH", usd: 2000, change24h: 3.5, lastUpdated: 1000 },
    { symbol: "SOL", usd: 100, change24h: -1.2, lastUpdated: 1000 },
    { symbol: "USDC", usd: 1, change24h: 0.01, lastUpdated: 1000 },
  ];

  it("calculates total value correctly", () => {
    const result = aggregatePortfolio(balances, prices);
    // 2.5 * 2000 + 100 * 100 + 1000 * 1 = 5000 + 10000 + 1000 = 16000
    expect(result.totalValue).toBe(16000);
  });

  it("calculates allocation percentages", () => {
    const result = aggregatePortfolio(balances, prices);
    const sol = result.items.find((i) => i.symbol === "SOL");
    expect(sol?.allocation).toBeCloseTo(62.5, 1);
  });

  it("sorts items by value descending", () => {
    const result = aggregatePortfolio(balances, prices);
    expect(result.items[0]?.symbol).toBe("SOL");
    expect(result.items[1]?.symbol).toBe("ETH");
    expect(result.items[2]?.symbol).toBe("USDC");
  });

  it("marks items without price as stale", () => {
    const firstPrice = prices[0];
    const result = aggregatePortfolio(balances, firstPrice ? [firstPrice] : []);
    const sol = result.items.find((i) => i.symbol === "SOL");
    expect(sol?.isStalePrice).toBe(true);
  });

  it("handles empty balances", () => {
    const result = aggregatePortfolio([], prices);
    expect(result.items).toHaveLength(0);
    expect(result.totalValue).toBe(0);
  });

  it("handles empty prices", () => {
    const result = aggregatePortfolio(balances, []);
    expect(result.totalValue).toBe(0);
    result.items.forEach((item) => {
      expect(item.isStalePrice).toBe(true);
    });
  });
});

describe("formatUsd", () => {
  it("formats null as dash", () => {
    expect(formatUsd(null)).toBe("—");
  });

  it("formats very small positive values", () => {
    expect(formatUsd(0.001)).toBe("<$0.01");
  });

  it("formats normal values with 2 decimals", () => {
    expect(formatUsd(1234.56)).toBe("$1,234.56");
  });

  it("formats zero", () => {
    expect(formatUsd(0)).toBe("$0.00");
  });
});

describe("formatPercent", () => {
  it("formats null as dash", () => {
    expect(formatPercent(null)).toBe("—");
  });

  it("formats positive with plus sign", () => {
    expect(formatPercent(3.5)).toBe("+3.50%");
  });

  it("formats negative with minus sign", () => {
    expect(formatPercent(-1.2)).toBe("-1.20%");
  });
});
