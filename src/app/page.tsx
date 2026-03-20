"use client";

import { Shell } from "@/components/terminal";
import { Dashboard } from "@/components/Dashboard";
import { useDevice, usePrices, usePortfolio } from "@/hooks";
import { useEffect, useState } from "react";
import { loadSettings } from "@/lib/settings";
import type { Settings } from "@/lib/schemas";

export default function Home() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const device = useDevice();
  const priceState = usePrices({
    pollIntervalMs: settings?.pricePollIntervalMs,
  });
  const portfolio = usePortfolio({
    addresses: device.addresses,
    prices: priceState.prices,
    ethRpcUrl: settings?.ethRpcUrl,
    solRpcUrl: settings?.solRpcUrl,
  });

  const networkStatus = priceState.isLoading
    ? "fetching" as const
    : priceState.error
      ? "error" as const
      : priceState.isUsingFallback
        ? "connected" as const
        : "idle" as const;

  return (
    <Shell deviceStatus={device.status} networkStatus={networkStatus}>
      <Dashboard
        device={device}
        priceState={priceState}
        portfolio={portfolio}
      />
    </Shell>
  );
}
