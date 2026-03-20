"use client";

import { useEffect, useState } from "react";

export function Shell({ children }: { children: React.ReactNode }) {
  const [reducedMotion, setReducedMotion] = useState(false);

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

  return (
    <div
      className={[
        "relative min-h-screen p-4 font-mono",
        reducedMotion ? "" : "crt-scanlines crt-flicker",
        "crt-glow",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <header className="mb-6 border-b border-border pb-2">
        <pre className="text-phosphor text-sm leading-tight">
          {`╔══════════════════════════════════════╗
║  VAULTVIEW v0.1.0                    ║
║  Hardware Wallet Portfolio Tracker   ║
╚══════════════════════════════════════╝`}
        </pre>
      </header>
      <main>{children}</main>
      <footer className="mt-8 border-t border-border pt-2 text-xs text-text-dim">
        <span>STATUS: READY</span>
        <span className="mx-2">│</span>
        <span>DEVICE: DISCONNECTED</span>
        <span className="mx-2">│</span>
        <span>NETWORK: IDLE</span>
      </footer>
    </div>
  );
}
