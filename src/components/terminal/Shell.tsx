"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadSettings } from "@/lib/settings";
import type { DeviceConnectionStatus } from "@/lib/dmk/types";

interface ShellProps {
  children: React.ReactNode;
  deviceStatus?: DeviceConnectionStatus;
  networkStatus?: "idle" | "fetching" | "connected" | "error";
}

export function Shell({
  children,
  deviceStatus = "disconnected",
  networkStatus = "idle",
}: ShellProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [enableScanlines, setEnableScanlines] = useState(true);
  const [enableFlicker, setEnableFlicker] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    mq.addEventListener("change", handler);
    return () => {
      mq.removeEventListener("change", handler);
    };
  }, []);

  useEffect(() => {
    const settings = loadSettings();
    setEnableScanlines(settings.enableScanlines);
    setEnableFlicker(settings.enableFlicker);
  }, []);

  const showScanlines = !reducedMotion && enableScanlines;
  const showFlicker = !reducedMotion && enableFlicker;

  const deviceLabel = deviceStatus.toUpperCase();
  const networkLabel = networkStatus.toUpperCase();

  return (
    <div
      className={[
        "relative min-h-screen p-4 font-mono",
        showScanlines ? "crt-scanlines" : "",
        showFlicker ? "crt-flicker" : "",
        "crt-glow",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <header className="mb-6 border-b border-border pb-2">
        <div className="flex items-start justify-between">
          <pre className="text-phosphor text-sm leading-tight">
            {`╔══════════════════════════════════════╗
║  VAULTVIEW v0.1.0                    ║
║  Hardware Wallet Portfolio Tracker   ║
╚══════════════════════════════════════╝`}
          </pre>
          <nav className="flex gap-3 pt-1 text-xs">
            <Link
              href="/"
              className="text-text-dim hover:text-phosphor transition-colors"
            >
              [DASHBOARD]
            </Link>
            <Link
              href="/settings"
              className="text-text-dim hover:text-phosphor transition-colors"
            >
              [SETTINGS]
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="mt-8 border-t border-border pt-2 text-xs text-text-dim">
        <span>STATUS: READY</span>
        <span className="mx-2">│</span>
        <span>
          DEVICE:{" "}
          <span
            className={
              deviceStatus === "connected"
                ? "text-phosphor"
                : deviceStatus === "error"
                  ? "text-red"
                  : ""
            }
          >
            {deviceLabel}
          </span>
        </span>
        <span className="mx-2">│</span>
        <span>
          NETWORK:{" "}
          <span
            className={
              networkStatus === "error"
                ? "text-red"
                : networkStatus === "fetching"
                  ? "text-amber"
                  : ""
            }
          >
            {networkLabel}
          </span>
        </span>
      </footer>
    </div>
  );
}
