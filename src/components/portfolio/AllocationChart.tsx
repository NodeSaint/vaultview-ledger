"use client";

import type { PortfolioItem } from "@/lib/portfolio";

interface AllocationChartProps {
  items: PortfolioItem[];
}

const BAR_WIDTH = 40;

export function AllocationChart({ items }: AllocationChartProps) {
  // Only show items with meaningful allocation
  const displayItems = items
    .filter((i) => i.allocation > 0.5)
    .slice(0, 10);

  if (displayItems.length === 0) return null;

  const maxSymbolLen = Math.max(...displayItems.map((i) => i.symbol.length));

  return (
    <div className="mt-4">
      <div className="mb-2 text-sm text-text-dim">
        ┌─ ALLOCATION
      </div>
      <pre className="text-sm leading-relaxed">
        {displayItems.map((item, i) => {
          const filled = Math.round((item.allocation / 100) * BAR_WIDTH);
          const bar = "█".repeat(filled) + "░".repeat(BAR_WIDTH - filled);
          const symbol = item.symbol.padEnd(maxSymbolLen);

          return (
            <span key={i}>
              <span className="text-amber">{symbol}</span>
              {" "}
              <span className="text-phosphor">{bar}</span>
              {" "}
              <span className="text-text-dim">
                {item.allocation.toFixed(1)}%
              </span>
              {"\n"}
            </span>
          );
        })}
      </pre>
    </div>
  );
}
