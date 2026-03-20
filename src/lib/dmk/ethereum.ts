import { SignerEthBuilder } from "@ledgerhq/device-signer-kit-ethereum";
import type { DeviceSessionId } from "@ledgerhq/device-management-kit";
import { firstValueFrom } from "rxjs";
import { filter, map } from "rxjs/operators";
import { getDmk } from "./client";
import { DERIVATION_PATHS } from "./types";
import type { ChainAddress, AssetBalance } from "./types";
import { DeviceError, NetworkError, ValidationError } from "@/lib/errors";
import { validateRpcUrl } from "@/lib/security";
import { ethBalanceResponseSchema, ethCallResponseSchema } from "@/lib/schemas";

const DEFAULT_ETH_RPC = "https://eth-mainnet.g.alchemy.com/v2/demo";

/** ERC-20 token list — curated, audited contract addresses only */
const ERC20_TOKENS: Array<{
  symbol: string;
  name: string;
  contractAddress: string;
  decimals: number;
  coingeckoId: string;
}> = [
  { symbol: "USDT", name: "Tether", contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6, coingeckoId: "tether" },
  { symbol: "USDC", name: "USD Coin", contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6, coingeckoId: "usd-coin" },
  { symbol: "DAI", name: "Dai", contractAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18, coingeckoId: "dai" },
  { symbol: "WBTC", name: "Wrapped Bitcoin", contractAddress: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", decimals: 8, coingeckoId: "wrapped-bitcoin" },
  { symbol: "LINK", name: "Chainlink", contractAddress: "0x514910771AF9Ca656af840dff83E8264EcF986CA", decimals: 18, coingeckoId: "chainlink" },
  { symbol: "UNI", name: "Uniswap", contractAddress: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", decimals: 18, coingeckoId: "uniswap" },
  { symbol: "AAVE", name: "Aave", contractAddress: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9", decimals: 18, coingeckoId: "aave" },
  { symbol: "MKR", name: "Maker", contractAddress: "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2", decimals: 18, coingeckoId: "maker" },
  { symbol: "LDO", name: "Lido DAO", contractAddress: "0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32", decimals: 18, coingeckoId: "lido-dao" },
  { symbol: "ARB", name: "Arbitrum", contractAddress: "0xB50721BCf8d664c30412Cfbc6cf7a15145234ad1", decimals: 18, coingeckoId: "arbitrum" },
];

/** Derive ETH address from Ledger device. */
export async function deriveEthAddress(
  sessionId: DeviceSessionId
): Promise<ChainAddress> {
  const dmk = getDmk();
  const signer = new SignerEthBuilder({ dmk, sessionId }).build();
  const derivationPath = DERIVATION_PATHS.ethereum;

  try {
    const { observable } = signer.getAddress(derivationPath, {
      checkOnDevice: false,
      returnChainCode: false,
    });

    const result = await firstValueFrom(
      observable.pipe(
        filter(
          (state): state is Extract<typeof state, { status: "completed" }> =>
            String(state.status) === "completed"
        ),
        map((state) => state.output)
      )
    );

    return {
      chain: "ethereum",
      address: result.address,
      derivationPath,
    };
  } catch (error) {
    throw new DeviceError("Failed to derive Ethereum address", error);
  }
}

/** Fetch native ETH balance via JSON-RPC. */
export async function fetchEthBalance(
  address: string,
  rpcUrl?: string
): Promise<AssetBalance> {
  const url = validateRpcUrl(rpcUrl ?? DEFAULT_ETH_RPC);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_getBalance",
      params: [address, "latest"],
      id: 1,
    }),
  });

  if (!response.ok) {
    throw new NetworkError(`ETH RPC returned ${String(response.status)}`);
  }

  const json: unknown = await response.json();
  const parsed = ethBalanceResponseSchema.safeParse(json);

  if (!parsed.success) {
    throw new ValidationError("Invalid ETH balance response", parsed.error);
  }

  if (parsed.data.error) {
    throw new NetworkError(
      `ETH RPC error: ${parsed.data.error.message}`
    );
  }

  const weiHex = parsed.data.result ?? "0x0";
  const wei = BigInt(weiHex);
  const ethBalance = Number(wei) / 1e18;

  return {
    chain: "ethereum",
    symbol: "ETH",
    name: "Ethereum",
    balance: ethBalance.toFixed(6),
    contractAddress: null,
    decimals: 18,
  };
}

/** Fetch ERC-20 token balance via eth_call. */
async function fetchErc20Balance(
  walletAddress: string,
  token: (typeof ERC20_TOKENS)[number],
  rpcUrl: string
): Promise<AssetBalance | null> {
  const paddedAddress = walletAddress.slice(2).padStart(64, "0");
  const data = `0x70a08231000000000000000000000000${paddedAddress}`;

  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_call",
      params: [{ to: token.contractAddress, data }, "latest"],
      id: 1,
    }),
  });

  if (!response.ok) return null;

  const json: unknown = await response.json();
  const parsed = ethCallResponseSchema.safeParse(json);

  if (!parsed.success || parsed.data.error) return null;

  const rawHex = parsed.data.result;
  if (!rawHex || rawHex === "0x" || rawHex === "0x0") return null;

  const rawBalance = BigInt(rawHex);
  if (rawBalance === 0n) return null;

  const balance = Number(rawBalance) / Math.pow(10, token.decimals);

  return {
    chain: "ethereum",
    symbol: token.symbol,
    name: token.name,
    balance: balance.toFixed(6),
    contractAddress: token.contractAddress,
    decimals: token.decimals,
  };
}

/** Fetch all ETH + ERC-20 balances for an address. */
export async function fetchAllEthBalances(
  address: string,
  rpcUrl?: string
): Promise<AssetBalance[]> {
  const url = validateRpcUrl(rpcUrl ?? DEFAULT_ETH_RPC);
  const balances: AssetBalance[] = [];

  const ethBalance = await fetchEthBalance(address, url);
  balances.push(ethBalance);

  const tokenResults = await Promise.allSettled(
    ERC20_TOKENS.map((token) => fetchErc20Balance(address, token, url))
  );

  for (const result of tokenResults) {
    if (result.status === "fulfilled" && result.value) {
      balances.push(result.value);
    }
  }

  return balances;
}

export { ERC20_TOKENS };
