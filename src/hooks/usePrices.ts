"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchCoinGeckoPrices,
  cachePrices,
  getAllCachedPrices,
  connectCoinCapWebSocket,
} from "@/lib/prices";
import type { PriceData } from "@/lib/prices";

interface UsePricesOptions {
  /** Poll interval in ms. Default 60000 (60s). Min 10000. */
  pollIntervalMs?: number;
  /** Symbols to fetch prices for. If empty, fetches all supported. */
  symbols?: string[];
}

interface UsePricesReturn {
  prices: PriceData[];
  isLoading: boolean;
  error: string | null;
  isUsingFallback: boolean;
  lastFetched: number | null;
  refresh: () => Promise<void>;
}

export function usePrices(options?: UsePricesOptions): UsePricesReturn {
  const { pollIntervalMs = 60_000, symbols } = options ?? {};
  const interval = Math.max(pollIntervalMs, 10_000);

  const [prices, setPrices] = useState<PriceData[]>(() => getAllCachedPrices());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  const failCountRef = useRef(0);
  const wsRef = useRef<{ close: () => void } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activateFallback = useCallback((syms?: string[]) => {
    setIsUsingFallback(true);

    wsRef.current = connectCoinCapWebSocket(
      (updatedPrices) => {
        cachePrices(updatedPrices);
        setPrices((prev) => {
          const map = new Map(prev.map((p) => [p.symbol, p]));
          for (const p of updatedPrices) {
            map.set(p.symbol, p);
          }
          return Array.from(map.values());
        });
        setLastFetched(Date.now());
        setError(null);
      },
      (wsError) => {
        setError(`Fallback error: ${wsError.message}`);
      },
      syms
    );
  }, []);

  const fetchPrices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchCoinGeckoPrices(symbols);
      cachePrices(data);
      setPrices(data);
      setLastFetched(Date.now());
      setIsUsingFallback(false);
      failCountRef.current = 0;
    } catch (err) {
      failCountRef.current += 1;
      const message = err instanceof Error ? err.message : "Price fetch failed";
      setError(message);

      // After 3 consecutive failures, switch to CoinCap WebSocket
      if (failCountRef.current >= 3 && !wsRef.current) {
        activateFallback(symbols);
      }

      // Load cached prices as interim
      const cached = getAllCachedPrices();
      if (cached.length > 0) {
        setPrices(cached);
      }
    } finally {
      setIsLoading(false);
    }
  }, [symbols, activateFallback]);

  // Initial fetch + polling
  useEffect(() => {
    void fetchPrices();

    const scheduleNext = () => {
      // Exponential backoff on failure, capped at 5 minutes
      const backoff = Math.min(
        interval * Math.pow(2, failCountRef.current),
        300_000
      );
      const nextInterval = failCountRef.current > 0 ? backoff : interval;

      timerRef.current = setTimeout(() => {
        void fetchPrices().then(scheduleNext);
      }, nextInterval);
    };
    scheduleNext();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [fetchPrices, interval]);

  return {
    prices,
    isLoading,
    error,
    isUsingFallback,
    lastFetched,
    refresh: fetchPrices,
  };
}
