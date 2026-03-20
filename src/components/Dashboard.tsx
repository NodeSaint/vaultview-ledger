"use client";

import { useEffect } from "react";
import { BrowserGuard, ConnectButton, DeviceStatus } from "@/components/device";
import { BalanceGrid, AllocationChart, DCATracker } from "@/components/portfolio";
import { Prompt, Ticker } from "@/components/terminal";
import { useDevice, usePrices, usePortfolio } from "@/hooks";

export function Dashboard() {
  const device = useDevice();
  const { prices, isLoading: pricesLoading, isUsingFallback, lastFetched } = usePrices();
  const portfolio = usePortfolio({
    addresses: device.addresses,
    prices,
  });

  const { deriveAddresses } = device;
  const { fetchBalances } = portfolio;
  const deviceStatus = device.status;
  const addressCount = device.addresses.length;

  // Auto-derive addresses when connected
  useEffect(() => {
    if (deviceStatus === "connected" && addressCount === 0) {
      void deriveAddresses();
    }
  }, [deviceStatus, addressCount, deriveAddresses]);

  // Auto-fetch balances when addresses are derived
  useEffect(() => {
    if (addressCount > 0) {
      void fetchBalances();
    }
  }, [addressCount, fetchBalances]);

  const tickerItems = prices.slice(0, 8).map((p) => ({
    symbol: p.symbol,
    price: p.usd.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    change: (p.change24h ?? 0) > 0
      ? "up" as const
      : (p.change24h ?? 0) < 0
        ? "down" as const
        : "flat" as const,
  }));

  return (
    <BrowserGuard>
      {/* Price Ticker */}
      {tickerItems.length > 0 && <Ticker items={tickerItems} />}

      {/* Connection Controls */}
      <div className="my-4 flex items-center gap-4">
        <ConnectButton
          status={device.status}
          onConnect={device.connect}
          onDisconnect={device.disconnect}
        />
        {pricesLoading && (
          <span className="text-xs text-amber animate-pulse">
            FETCHING PRICES...
          </span>
        )}
        {isUsingFallback && (
          <span className="text-xs text-amber">
            FALLBACK: COINCAP WS
          </span>
        )}
        {lastFetched && (
          <span className="text-xs text-text-dim">
            PRICES: {new Date(lastFetched).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Device Status */}
      <DeviceStatus
        status={device.status}
        device={device.device}
        addresses={device.addresses}
        error={device.error}
      />

      {/* Portfolio Grid */}
      {portfolio.isLoading && (
        <Prompt label="fetch">
          <span className="text-amber animate-pulse">
            FETCHING BALANCES...
          </span>
          <span className="ml-1 inline-block animate-pulse text-phosphor">█</span>
        </Prompt>
      )}

      {portfolio.error && (
        <div className="mb-4 border border-red p-2 text-sm text-red">
          ERR: {portfolio.error}
        </div>
      )}

      {portfolio.portfolio && (
        <>
          <BalanceGrid portfolio={portfolio.portfolio} />
          <AllocationChart items={portfolio.portfolio.items} />
        </>
      )}

      {/* Placeholder when not connected */}
      {device.status === "disconnected" && (
        <Prompt label="status">
          <span className="text-text-dim">
            Connect your Ledger to view balances.
          </span>
          <span className="ml-1 inline-block animate-pulse text-phosphor">█</span>
        </Prompt>
      )}

      {/* DCA Tracker — always available */}
      <DCATracker prices={prices} />
    </BrowserGuard>
  );
}
