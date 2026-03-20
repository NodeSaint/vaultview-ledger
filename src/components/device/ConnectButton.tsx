"use client";

import type { DeviceConnectionStatus } from "@/lib/dmk";

interface ConnectButtonProps {
  status: DeviceConnectionStatus;
  onConnect: () => void | Promise<void>;
  onDisconnect: () => void | Promise<void>;
}

const STATUS_LABELS: Record<DeviceConnectionStatus, string> = {
  disconnected: "CONNECT LEDGER",
  discovering: "SCANNING...",
  connecting: "CONNECTING...",
  connected: "DISCONNECT",
  error: "RETRY CONNECTION",
};

export function ConnectButton({
  status,
  onConnect,
  onDisconnect,
}: ConnectButtonProps) {
  const isConnected = status === "connected";
  const isBusy = status === "discovering" || status === "connecting";

  const handleClick = () => {
    if (isConnected) {
      void onDisconnect();
    } else if (!isBusy) {
      void onConnect();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isBusy}
      className={[
        "border px-4 py-2 font-mono text-sm transition-colors",
        isConnected
          ? "border-red text-red hover:bg-red hover:text-surface"
          : isBusy
            ? "cursor-wait border-amber text-amber"
            : "border-phosphor text-phosphor hover:bg-phosphor hover:text-surface",
        isBusy ? "animate-pulse" : "",
      ].join(" ")}
    >
      [{STATUS_LABELS[status]}]
    </button>
  );
}
