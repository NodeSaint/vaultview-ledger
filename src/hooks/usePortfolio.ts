"use client";

import { useCallback, useEffect, useState } from "react";
import type { AssetBalance, ChainAddress } from "@/lib/dmk/types";
import { fetchAllEthBalances, fetchAllSolBalances } from "@/lib/dmk";
import type { PriceData } from "@/lib/prices";
import { aggregatePortfolio } from "@/lib/portfolio";
import type { PortfolioSummary } from "@/lib/portfolio";

interface UsePortfolioReturn {
  portfolio: PortfolioSummary | null;
  balances: AssetBalance[];
  isLoading: boolean;
  error: string | null;
  fetchBalances: () => Promise<void>;
}

interface UsePortfolioOptions {
  addresses: ChainAddress[];
  prices: PriceData[];
  ethRpcUrl?: string;
  solRpcUrl?: string;
}

export function usePortfolio(options: UsePortfolioOptions): UsePortfolioReturn {
  const { addresses, prices, ethRpcUrl, solRpcUrl } = options;

  const [balances, setBalances] = useState<AssetBalance[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    if (addresses.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const allBalances: AssetBalance[] = [];

      const ethAddress = addresses.find((a) => a.chain === "ethereum");
      const solAddress = addresses.find((a) => a.chain === "solana");

      const fetches = [];
      if (ethAddress) {
        fetches.push(
          fetchAllEthBalances(ethAddress.address, ethRpcUrl).then((b) =>
            allBalances.push(...b)
          )
        );
      }
      if (solAddress) {
        fetches.push(
          fetchAllSolBalances(solAddress.address, solRpcUrl).then((b) =>
            allBalances.push(...b)
          )
        );
      }

      await Promise.allSettled(fetches);
      setBalances(allBalances);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch balances";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [addresses, ethRpcUrl, solRpcUrl]);

  // Re-aggregate whenever balances or prices change
  useEffect(() => {
    if (balances.length > 0) {
      const aggregated = aggregatePortfolio(balances, prices);
      setPortfolio(aggregated);
    }
  }, [balances, prices]);

  return {
    portfolio,
    balances,
    isLoading,
    error,
    fetchBalances,
  };
}
