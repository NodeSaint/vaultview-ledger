"use client";

import { Prompt } from "@/components/terminal";
import { BrowserGuard } from "@/components/device/BrowserGuard";

export function Dashboard() {
  return (
    <BrowserGuard>
      <Prompt label="portfolio">
        <span className="text-text-dim">
          Connect your Ledger to view balances.
        </span>
      </Prompt>
      <Prompt label="status">
        <span className="text-text-dim">
          Awaiting device connection...
        </span>
        <span className="ml-1 inline-block animate-pulse text-phosphor">█</span>
      </Prompt>
    </BrowserGuard>
  );
}
