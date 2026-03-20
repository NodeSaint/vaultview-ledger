import { describe, it, expect } from "vitest";
import {
  ethBalanceResponseSchema,
  solBalanceResponseSchema,
  coingeckoPriceResponseSchema,
  dcaEntrySchema,
  settingsSchema,
} from "./schemas";

describe("ethBalanceResponseSchema", () => {
  it("accepts valid balance response", () => {
    const result = ethBalanceResponseSchema.safeParse({
      jsonrpc: "2.0",
      id: 1,
      result: "0x1bc16d674ec80000",
    });
    expect(result.success).toBe(true);
  });

  it("accepts error response", () => {
    const result = ethBalanceResponseSchema.safeParse({
      jsonrpc: "2.0",
      id: 1,
      error: { code: -32600, message: "Invalid request" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects response without result or error", () => {
    const result = ethBalanceResponseSchema.safeParse({
      jsonrpc: "2.0",
      id: 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects wrong jsonrpc version", () => {
    const result = ethBalanceResponseSchema.safeParse({
      jsonrpc: "1.0",
      id: 1,
      result: "0x0",
    });
    expect(result.success).toBe(false);
  });
});

describe("solBalanceResponseSchema", () => {
  it("accepts valid SOL balance response", () => {
    const result = solBalanceResponseSchema.safeParse({
      jsonrpc: "2.0",
      id: 1,
      result: { context: { slot: 12345 }, value: 1000000000 },
    });
    expect(result.success).toBe(true);
  });
});

describe("coingeckoPriceResponseSchema", () => {
  it("accepts valid CoinGecko response", () => {
    const result = coingeckoPriceResponseSchema.safeParse({
      ethereum: { usd: 2000, usd_24h_change: 3.5 },
      solana: { usd: 100 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects response with missing usd field", () => {
    const result = coingeckoPriceResponseSchema.safeParse({
      ethereum: { change: 3.5 },
    });
    expect(result.success).toBe(false);
  });
});

describe("dcaEntrySchema", () => {
  it("accepts valid entry", () => {
    const result = dcaEntrySchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      asset: "ETH",
      amount: 1.5,
      priceAtPurchase: 2000,
      totalCost: 3000,
      date: "2026-01-15T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative amount", () => {
    const result = dcaEntrySchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      asset: "ETH",
      amount: -1,
      priceAtPurchase: 2000,
      totalCost: -2000,
      date: "2026-01-15T00:00:00.000Z",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty asset name", () => {
    const result = dcaEntrySchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      asset: "",
      amount: 1,
      priceAtPurchase: 2000,
      totalCost: 2000,
      date: "2026-01-15T00:00:00.000Z",
    });
    expect(result.success).toBe(false);
  });
});

describe("settingsSchema", () => {
  it("applies defaults", () => {
    const result = settingsSchema.parse({});
    expect(result.pricePollIntervalMs).toBe(60_000);
    expect(result.enableScanlines).toBe(true);
    expect(result.enableFlicker).toBe(true);
  });

  it("rejects poll interval below minimum", () => {
    const result = settingsSchema.safeParse({ pricePollIntervalMs: 1000 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid RPC URL", () => {
    const result = settingsSchema.safeParse({ ethRpcUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });
});
