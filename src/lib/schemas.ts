import { z } from "zod";

// ─── Ethereum RPC Response Schemas ───

const rpcErrorSchema = z.object({
  code: z.number(),
  message: z.string(),
});

export const ethBalanceResponseSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.number(),
  result: z.string().optional(),
  error: rpcErrorSchema.optional(),
}).refine(
  (data) => data.result !== undefined || data.error !== undefined,
  { message: "Response must have either result or error" }
);

export const ethCallResponseSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.number(),
  result: z.string().optional(),
  error: rpcErrorSchema.optional(),
});

// ─── Solana RPC Response Schemas ───

export const solBalanceResponseSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.number(),
  result: z
    .object({
      context: z.object({ slot: z.number() }),
      value: z.number(),
    })
    .optional(),
  error: rpcErrorSchema.optional(),
}).transform((data) => ({
  ...data,
  result: data.result ?? { context: { slot: 0 }, value: 0 },
}));

const splTokenAmountSchema = z.object({
  amount: z.string(),
  decimals: z.number(),
  uiAmount: z.number().nullable(),
  uiAmountString: z.string(),
});

const splTokenAccountSchema = z.object({
  account: z.object({
    data: z.object({
      parsed: z.object({
        info: z.object({
          mint: z.string(),
          owner: z.string(),
          tokenAmount: splTokenAmountSchema,
        }),
        type: z.string(),
      }),
      program: z.string(),
    }),
    executable: z.boolean(),
    lamports: z.number(),
    owner: z.string(),
  }),
  pubkey: z.string(),
});

export const splTokenAccountsResponseSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.number(),
  result: z
    .object({
      context: z.object({ slot: z.number() }),
      value: z.array(splTokenAccountSchema),
    })
    .optional(),
  error: rpcErrorSchema.optional(),
}).transform((data) => ({
  ...data,
  result: data.result ?? { context: { slot: 0 }, value: [] },
}));

// ─── CoinGecko Price Response Schema ───

const coinPriceSchema = z.object({
  usd: z.number(),
  usd_24h_change: z.number().optional(),
  last_updated_at: z.number().optional(),
});

export const coingeckoPriceResponseSchema = z.record(z.string(), coinPriceSchema);

export type CoinGeckoPrice = z.infer<typeof coinPriceSchema>;
export type CoinGeckoPriceResponse = z.infer<typeof coingeckoPriceResponseSchema>;

// ─── DCA Entry Schema (localStorage) ───

export const dcaEntrySchema = z.object({
  id: z.string().uuid(),
  asset: z.string().min(1).max(20),
  amount: z.number().positive(),
  priceAtPurchase: z.number().positive(),
  totalCost: z.number().positive(),
  date: z.string().datetime(),
  notes: z.string().max(256).optional(),
});

export const dcaEntriesSchema = z.array(dcaEntrySchema);

export type DCAEntry = z.infer<typeof dcaEntrySchema>;

// ─── Settings Schema (localStorage) ───

export const settingsSchema = z.object({
  ethRpcUrl: z.string().url().optional(),
  solRpcUrl: z.string().url().optional(),
  pricePollIntervalMs: z.number().min(10_000).max(600_000).default(60_000),
  enableScanlines: z.boolean().default(true),
  enableFlicker: z.boolean().default(true),
});

export type Settings = z.infer<typeof settingsSchema>;
