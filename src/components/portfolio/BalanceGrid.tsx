"use client";

import { Table } from "@/components/terminal";
import { formatUsd, formatPercent } from "@/lib/portfolio";
import type { PortfolioSummary } from "@/lib/portfolio";

interface BalanceGridProps {
  portfolio: PortfolioSummary;
}

export function BalanceGrid({ portfolio }: BalanceGridProps) {
  const columns = [
    { key: "chain", header: "CHAIN" },
    { key: "symbol", header: "ASSET" },
    { key: "balance", header: "BALANCE", align: "right" as const },
    { key: "price", header: "PRICE", align: "right" as const },
    { key: "value", header: "VALUE", align: "right" as const },
    { key: "change", header: "24H", align: "right" as const },
    { key: "alloc", header: "ALLOC", align: "right" as const },
  ];

  const rows = portfolio.items.map((item) => ({
    chain: item.chain.toUpperCase().slice(0, 3),
    symbol: item.symbol,
    balance: formatBalance(item.balance),
    price: formatUsd(item.price),
    value: formatUsd(item.value),
    change: formatPercent(item.change24h),
    alloc: item.allocation > 0 ? `${item.allocation.toFixed(1)}%` : "—",
  }));

  return (
    <div>
      <div className="mb-2 text-sm text-text-dim">
        ┌─ PORTFOLIO ({portfolio.items.length} assets)
      </div>
      <Table columns={columns} rows={rows} />
      <div className="mt-2 flex gap-4 text-sm">
        <span className="text-text-dim">TOTAL VALUE:</span>
        <span className="text-amber">{formatUsd(portfolio.totalValue)}</span>
        <span className="text-text-dim">│</span>
        <span className="text-text-dim">UPDATED:</span>
        <span className="text-text-dim">
          {new Date(portfolio.lastUpdated).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}

function formatBalance(balance: string): string {
  const num = parseFloat(balance);
  if (num === 0) return "0";
  if (num < 0.000001) return "<0.000001";
  if (num < 1) return num.toFixed(6);
  if (num < 1000) return num.toFixed(4);
  return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
}
