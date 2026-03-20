import { z } from "zod";
import { dcaEntriesSchema } from "@/lib/schemas";
import type { DCAEntry } from "@/lib/schemas";
import { ValidationError } from "@/lib/errors";

const STORAGE_KEY = "vaultview_dca_entries";

/** Load DCA entries from localStorage with Zod validation. */
export function loadDcaEntries(): DCAEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const json: unknown = JSON.parse(raw);
    const parsed = dcaEntriesSchema.safeParse(json);

    if (!parsed.success) {
      // Corrupted data — do not silently discard
      // Store backup before resetting
      localStorage.setItem(`${STORAGE_KEY}_backup_${String(Date.now())}`, raw);
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }

    return parsed.data;
  } catch {
    return [];
  }
}

/** Save DCA entries to localStorage. */
function saveDcaEntries(entries: DCAEntry[]): void {
  const validated = dcaEntriesSchema.parse(entries);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
}

/** Add a new DCA entry. */
export function addDcaEntry(
  entry: Omit<DCAEntry, "id" | "totalCost">
): DCAEntry {
  const newEntry: DCAEntry = {
    ...entry,
    id: crypto.randomUUID(),
    totalCost: entry.amount * entry.priceAtPurchase,
  };

  const validated = z.object({
    id: z.string().uuid(),
    asset: z.string().min(1).max(20),
    amount: z.number().positive(),
    priceAtPurchase: z.number().positive(),
    totalCost: z.number().positive(),
    date: z.string().datetime(),
    notes: z.string().max(256).optional(),
  }).parse(newEntry);

  const entries = loadDcaEntries();
  entries.push(validated);
  saveDcaEntries(entries);

  return validated;
}

/** Update an existing DCA entry. */
export function updateDcaEntry(
  id: string,
  updates: Partial<Omit<DCAEntry, "id">>
): DCAEntry {
  const entries = loadDcaEntries();
  const index = entries.findIndex((e) => e.id === id);

  if (index === -1) {
    throw new ValidationError(`DCA entry not found: ${id}`);
  }

  const existing = entries[index];
  if (!existing) {
    throw new ValidationError(`DCA entry not found at index: ${String(index)}`);
  }
  const updated: DCAEntry = {
    ...existing,
    ...updates,
    id: existing.id,
  };

  // Recalculate total cost if amount or price changed
  if (updates.amount !== undefined || updates.priceAtPurchase !== undefined) {
    updated.totalCost = updated.amount * updated.priceAtPurchase;
  }

  entries[index] = updated;
  saveDcaEntries(entries);

  return updated;
}

/** Delete a DCA entry. */
export function deleteDcaEntry(id: string): void {
  const entries = loadDcaEntries();
  const filtered = entries.filter((e) => e.id !== id);
  saveDcaEntries(filtered);
}

/** Calculate cost basis for an asset. */
export function calculateCostBasis(asset: string): {
  totalInvested: number;
  totalAmount: number;
  averageCost: number;
  entryCount: number;
} {
  const entries = loadDcaEntries().filter(
    (e) => e.asset.toUpperCase() === asset.toUpperCase()
  );

  if (entries.length === 0) {
    return { totalInvested: 0, totalAmount: 0, averageCost: 0, entryCount: 0 };
  }

  const totalInvested = entries.reduce((sum, e) => sum + e.totalCost, 0);
  const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0);
  const averageCost = totalAmount > 0 ? totalInvested / totalAmount : 0;

  return {
    totalInvested,
    totalAmount,
    averageCost,
    entryCount: entries.length,
  };
}

/** Calculate unrealised P&L for an asset at the current price. */
export function calculateUnrealisedPnl(
  asset: string,
  currentPrice: number
): {
  unrealisedPnl: number;
  unrealisedPnlPercent: number;
  totalInvested: number;
  currentValue: number;
} {
  const basis = calculateCostBasis(asset);

  if (basis.totalAmount === 0) {
    return {
      unrealisedPnl: 0,
      unrealisedPnlPercent: 0,
      totalInvested: 0,
      currentValue: 0,
    };
  }

  const currentValue = basis.totalAmount * currentPrice;
  const unrealisedPnl = currentValue - basis.totalInvested;
  const unrealisedPnlPercent =
    basis.totalInvested > 0
      ? (unrealisedPnl / basis.totalInvested) * 100
      : 0;

  return {
    unrealisedPnl,
    unrealisedPnlPercent,
    totalInvested: basis.totalInvested,
    currentValue,
  };
}

/** Get a summary of all DCA'd assets. */
export function getDcaSummary(): Array<{
  asset: string;
  totalInvested: number;
  totalAmount: number;
  averageCost: number;
  entryCount: number;
}> {
  const entries = loadDcaEntries();
  const assets = [...new Set(entries.map((e) => e.asset.toUpperCase()))];

  return assets.map((asset) => ({
    asset,
    ...calculateCostBasis(asset),
  }));
}
