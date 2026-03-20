export {
  getDmk,
  isWebHidSupported,
  discoverDevice,
  connectDevice,
  getDeviceInfo,
  disconnectDevice,
  closeDmk,
} from "./client";
export {
  deriveEthAddress,
  fetchEthBalance,
  fetchAllEthBalances,
  ERC20_TOKENS,
} from "./ethereum";
export {
  deriveSolAddress,
  fetchSolBalance,
  fetchSplTokenBalances,
  fetchAllSolBalances,
} from "./solana";
export type {
  ChainId,
  ChainAddress,
  DeviceConnectionStatus,
  DeviceInfo,
  DeviceState,
  AssetBalance,
} from "./types";
export { DERIVATION_PATHS } from "./types";
