import type { AssetBalance } from "@/lib/dmk/types";
import type { PriceData } from "@/lib/prices";

/** A fully-resolved portfolio line item: balance + price + value */
export interface PortfolioItem {
  chain: string;
  symbol: string;
  name: string;
  balance: string;
  price: number | null;
  value: number | null;
  change24h: number | null;
  allocation: number;
  contractAddress: string | null;
  isStalePrice: boolean;
}

export interface PortfolioSummary {
  items: PortfolioItem[];
  totalValue: number;
  lastUpdated: number;
}

/** Merge on-chain balances with price data into a portfolio view. */
export function aggregatePortfolio(
  balances: AssetBalance[],
  prices: PriceData[]
): PortfolioSummary {
  const priceMap = new Map<string, PriceData>();
  for (const p of prices) {
    priceMap.set(p.symbol.toUpperCase(), p);
  }

  const items: PortfolioItem[] = balances.map((b) => {
    const price = priceMap.get(b.symbol.toUpperCase());
    const balanceNum = parseFloat(b.balance);
    const value = price ? balanceNum * price.usd : null;

    return {
      chain: b.chain,
      symbol: b.symbol,
      name: b.name,
      balance: b.balance,
      price: price?.usd ?? null,
      value,
      change24h: price?.change24h ?? null,
      allocation: 0,
      contractAddress: b.contractAddress,
      isStalePrice: !price,
    };
  });

  const totalValue = items.reduce((sum, item) => sum + (item.value ?? 0), 0);

  // Calculate allocation percentages
  for (const item of items) {
    if (item.value !== null && totalValue > 0) {
      item.allocation = (item.value / totalValue) * 100;
    }
  }

  // Sort by value descending (null values last)
  items.sort((a, b) => (b.value ?? -1) - (a.value ?? -1));

  return {
    items,
    totalValue,
    lastUpdated: Date.now(),
  };
}

/** Format a USD value for display. */
export function formatUsd(value: number | null): string {
  if (value === null) return "—";
  if (value < 0.01 && value > 0) return "<$0.01";
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Format a percentage for display. */
export function formatPercent(value: number | null): string {
  if (value === null) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}
