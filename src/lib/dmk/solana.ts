import { SignerSolanaBuilder } from "@ledgerhq/device-signer-kit-solana";
import type { DeviceSessionId } from "@ledgerhq/device-management-kit";
import { firstValueFrom } from "rxjs";
import { filter, map } from "rxjs/operators";
import { getDmk } from "./client";
import { DERIVATION_PATHS } from "./types";
import type { ChainAddress, AssetBalance } from "./types";
import { DeviceError, NetworkError, ValidationError } from "@/lib/errors";
import { validateRpcUrl } from "@/lib/security";
import {
  solBalanceResponseSchema,
  splTokenAccountsResponseSchema,
} from "@/lib/schemas";

const DEFAULT_SOL_RPC = "https://api.mainnet-beta.solana.com";

/** Derive SOL address from Ledger device. */
export async function deriveSolAddress(
  sessionId: DeviceSessionId
): Promise<ChainAddress> {
  const dmk = getDmk();
  const signer = new SignerSolanaBuilder({ dmk, sessionId }).build();
  const derivationPath = DERIVATION_PATHS.solana;

  try {
    const { observable } = signer.getAddress(derivationPath, {
      checkOnDevice: false,
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
      chain: "solana",
      address: typeof result === "string" ? result : (result as { publicKey: string }).publicKey,
      derivationPath,
    };
  } catch (error) {
    throw new DeviceError("Failed to derive Solana address", error);
  }
}

/** Fetch native SOL balance via JSON-RPC. */
export async function fetchSolBalance(
  address: string,
  rpcUrl?: string
): Promise<AssetBalance> {
  const url = validateRpcUrl(rpcUrl ?? DEFAULT_SOL_RPC);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "getBalance",
      params: [address],
      id: 1,
    }),
  });

  if (!response.ok) {
    throw new NetworkError(`SOL RPC returned ${String(response.status)}`);
  }

  const json: unknown = await response.json();
  const parsed = solBalanceResponseSchema.safeParse(json);

  if (!parsed.success) {
    throw new ValidationError("Invalid SOL balance response", parsed.error);
  }

  if (parsed.data.error) {
    throw new NetworkError(
      `SOL RPC error: ${parsed.data.error.message}`
    );
  }

  const lamports = parsed.data.result.value;
  const solBalance = lamports / 1e9;

  return {
    chain: "solana",
    symbol: "SOL",
    name: "Solana",
    balance: solBalance.toFixed(6),
    contractAddress: null,
    decimals: 9,
  };
}

/** Fetch SPL token balances for a Solana address. */
export async function fetchSplTokenBalances(
  address: string,
  rpcUrl?: string
): Promise<AssetBalance[]> {
  const url = validateRpcUrl(rpcUrl ?? DEFAULT_SOL_RPC);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "getTokenAccountsByOwner",
      params: [
        address,
        { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
        { encoding: "jsonParsed" },
      ],
      id: 1,
    }),
  });

  if (!response.ok) {
    throw new NetworkError(`SOL RPC returned ${String(response.status)}`);
  }

  const json: unknown = await response.json();
  const parsed = splTokenAccountsResponseSchema.safeParse(json);

  if (!parsed.success) {
    throw new ValidationError("Invalid SPL token response", parsed.error);
  }

  if (parsed.data.error) {
    throw new NetworkError(
      `SOL RPC error: ${parsed.data.error.message}`
    );
  }

  const balances: AssetBalance[] = [];

  for (const account of parsed.data.result.value) {
    const info = account.account.data.parsed.info;
    const amount = info.tokenAmount;

    if (Number(amount.uiAmountString) === 0) continue;

    balances.push({
      chain: "solana",
      symbol: "SPL",
      name: info.mint.slice(0, 8) + "...",
      balance: amount.uiAmountString,
      contractAddress: info.mint,
      decimals: amount.decimals,
    });
  }

  return balances;
}

/** Fetch all SOL + SPL balances for an address. */
export async function fetchAllSolBalances(
  address: string,
  rpcUrl?: string
): Promise<AssetBalance[]> {
  const url = validateRpcUrl(rpcUrl ?? DEFAULT_SOL_RPC);
  const balances: AssetBalance[] = [];

  const solBalance = await fetchSolBalance(address, url);
  balances.push(solBalance);

  try {
    const splBalances = await fetchSplTokenBalances(address, url);
    balances.push(...splBalances);
  } catch {
    // SPL fetch is non-critical — native balance still valid
  }

  return balances;
}
