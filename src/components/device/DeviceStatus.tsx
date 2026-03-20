"use client";

import type { DeviceInfo, DeviceConnectionStatus, ChainAddress } from "@/lib/dmk";

interface DeviceStatusProps {
  status: DeviceConnectionStatus;
  device: DeviceInfo | null;
  addresses: ChainAddress[];
  error: string | null;
}

export function DeviceStatus({
  status,
  device,
  addresses,
  error,
}: DeviceStatusProps) {
  return (
    <div className="mb-4 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-text-dim">DEVICE:</span>
        <StatusIndicator status={status} />
        {device && (
          <span className="text-phosphor">
            {device.name} ({device.modelId})
          </span>
        )}
      </div>

      {error && (
        <div className="mt-1 text-red">
          ERR: {error}
        </div>
      )}

      {addresses.length > 0 && (
        <div className="mt-2 border-l border-border pl-2">
          {addresses.map((addr) => (
            <div key={addr.chain} className="flex gap-2">
              <span className="text-amber">{addr.chain.toUpperCase()}:</span>
              <span className="text-phosphor font-mono">
                {truncateAddress(addr.address)}
              </span>
              <span className="text-text-dim text-xs">
                ({addr.derivationPath})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusIndicator({ status }: { status: DeviceConnectionStatus }) {
  const colours: Record<DeviceConnectionStatus, string> = {
    disconnected: "text-text-dim",
    discovering: "text-amber animate-pulse",
    connecting: "text-amber animate-pulse",
    connected: "text-phosphor",
    error: "text-red",
  };

  const symbols: Record<DeviceConnectionStatus, string> = {
    disconnected: "○",
    discovering: "◌",
    connecting: "◌",
    connected: "●",
    error: "✘",
  };

  return (
    <span className={colours[status]}>
      {symbols[status]} {status.toUpperCase()}
    </span>
  );
}

function truncateAddress(address: string): string {
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}
