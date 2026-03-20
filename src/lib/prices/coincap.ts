import type { PriceData } from "./coingecko";

const WS_URL = "wss://ws.coincap.io/prices";

/** Map our symbols to CoinCap asset IDs (lowercase) */
const COINCAP_IDS: Record<string, string> = {
  ETH: "ethereum",
  SOL: "solana",
  BTC: "bitcoin",
  USDT: "tether",
  USDC: "usd-coin",
  DAI: "dai",
  LINK: "chainlink",
  UNI: "uniswap",
};

const ID_TO_SYMBOL: Record<string, string> = Object.fromEntries(
  Object.entries(COINCAP_IDS).map(([symbol, id]) => [id, symbol])
);

export type PriceUpdateCallback = (prices: PriceData[]) => void;
export type ErrorCallback = (error: Error) => void;

interface CoinCapConnection {
  close: () => void;
}

/**
 * Connect to CoinCap WebSocket for real-time price streaming.
 * Used as fallback when CoinGecko rate-limits us.
 */
export function connectCoinCapWebSocket(
  onPriceUpdate: PriceUpdateCallback,
  onError?: ErrorCallback,
  symbols?: string[]
): CoinCapConnection {
  const assetIds = symbols
    ? symbols
        .map((s) => COINCAP_IDS[s.toUpperCase()])
        .filter((id): id is string => id !== undefined)
    : Object.values(COINCAP_IDS);

  const url = `${WS_URL}?assets=${assetIds.join(",")}`;
  const ws = new WebSocket(url);

  ws.onmessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(String(event.data)) as Record<string, string>;
      const prices: PriceData[] = [];

      for (const [id, priceStr] of Object.entries(data)) {
        const symbol = ID_TO_SYMBOL[id];
        if (!symbol) continue;

        const usd = parseFloat(priceStr);
        if (isNaN(usd)) continue;

        prices.push({
          symbol,
          usd,
          change24h: null,
          lastUpdated: Date.now() / 1000,
        });
      }

      if (prices.length > 0) {
        onPriceUpdate(prices);
      }
    } catch (error) {
      onError?.(
        error instanceof Error ? error : new Error("Failed to parse CoinCap message")
      );
    }
  };

  ws.onerror = () => {
    onError?.(new Error("CoinCap WebSocket error"));
  };

  ws.onclose = () => {
    // Connection closed — consumer should decide whether to reconnect
  };

  return {
    close: () => {
      ws.close();
    },
  };
}

export { COINCAP_IDS };
