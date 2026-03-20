import { NetworkError, ValidationError } from "@/lib/errors";
import { coingeckoPriceResponseSchema } from "@/lib/schemas";
import type { CoinGeckoPriceResponse } from "@/lib/schemas";

const BASE_URL = "https://api.coingecko.com/api/v3";

/** Map of our asset symbols to CoinGecko IDs */
const COINGECKO_IDS: Record<string, string> = {
  ETH: "ethereum",
  SOL: "solana",
  BTC: "bitcoin",
  USDT: "tether",
  USDC: "usd-coin",
  DAI: "dai",
  WBTC: "wrapped-bitcoin",
  LINK: "chainlink",
  UNI: "uniswap",
  AAVE: "aave",
  MKR: "maker",
  LDO: "lido-dao",
  ARB: "arbitrum",
};

/** Reverse map: CoinGecko ID → symbol */
const ID_TO_SYMBOL: Record<string, string> = Object.fromEntries(
  Object.entries(COINGECKO_IDS).map(([symbol, id]) => [id, symbol])
);

export interface PriceData {
  symbol: string;
  usd: number;
  change24h: number | null;
  lastUpdated: number;
}

/**
 * Fetch prices from CoinGecko free API.
 * Rate limit: ~30 req/min. Call no more than once per 60s.
 */
export async function fetchCoinGeckoPrices(
  symbols?: string[]
): Promise<PriceData[]> {
  const ids = symbols
    ? symbols
        .map((s) => COINGECKO_IDS[s.toUpperCase()])
        .filter((id): id is string => id !== undefined)
    : Object.values(COINGECKO_IDS);

  if (ids.length === 0) return [];

  const params = new URLSearchParams({
    ids: ids.join(","),
    vs_currencies: "usd",
    include_24hr_change: "true",
    include_last_updated_at: "true",
  });

  const response = await fetch(`${BASE_URL}/simple/price?${params.toString()}`);

  if (response.status === 429) {
    throw new NetworkError("CoinGecko rate limit exceeded (429)");
  }

  if (!response.ok) {
    throw new NetworkError(
      `CoinGecko returned ${String(response.status)}`
    );
  }

  const json: unknown = await response.json();
  const parsed = coingeckoPriceResponseSchema.safeParse(json);

  if (!parsed.success) {
    throw new ValidationError("Invalid CoinGecko response", parsed.error);
  }

  return mapResponseToPriceData(parsed.data);
}

function mapResponseToPriceData(data: CoinGeckoPriceResponse): PriceData[] {
  return Object.entries(data).map(([id, price]) => ({
    symbol: ID_TO_SYMBOL[id] ?? id.toUpperCase(),
    usd: price.usd,
    change24h: price.usd_24h_change ?? null,
    lastUpdated: price.last_updated_at ?? Date.now() / 1000,
  }));
}

export { COINGECKO_IDS, ID_TO_SYMBOL };
