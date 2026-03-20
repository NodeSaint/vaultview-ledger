import type { DeviceSessionId } from "@ledgerhq/device-management-kit";

/** Supported blockchain networks */
export type ChainId = "ethereum" | "solana";

/** Derivation paths per chain */
export const DERIVATION_PATHS: Record<ChainId, string> = {
  ethereum: "44'/60'/0'/0/0",
  solana: "44'/501'/0'",
} as const;

/** Resolved address for a chain */
export interface ChainAddress {
  chain: ChainId;
  address: string;
  derivationPath: string;
}

/** Device connection state */
export type DeviceConnectionStatus =
  | "disconnected"
  | "discovering"
  | "connecting"
  | "connected"
  | "error";

/** Device info (safe to display — no session IDs or serials) */
export interface DeviceInfo {
  modelId: string;
  name: string;
}

/** Full device state exposed to UI */
export interface DeviceState {
  status: DeviceConnectionStatus;
  device: DeviceInfo | null;
  sessionId: DeviceSessionId | null;
  addresses: ChainAddress[];
  error: string | null;
}

/** Balance for a single asset */
export interface AssetBalance {
  chain: ChainId;
  symbol: string;
  name: string;
  balance: string;
  contractAddress: string | null;
  decimals: number;
}
