import { z } from "zod";
import type { PortfolioSummary } from "./aggregator";
import type { DCAEntry } from "@/lib/schemas";
import { loadDcaEntries } from "./dca";

/** Export portfolio as JSON. Returns a downloadable Blob. */
export function exportPortfolioJson(portfolio: PortfolioSummary): Blob {
  const exportData = {
    exportedAt: new Date().toISOString(),
    version: "0.1.0",
    portfolio: {
      totalValue: portfolio.totalValue,
      items: portfolio.items.map((item) => ({
        chain: item.chain,
        symbol: item.symbol,
        name: item.name,
        balance: item.balance,
        price: item.price,
        value: item.value,
        allocation: item.allocation,
      })),
    },
  };

  return new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json",
  });
}

/** Export DCA entries as JSON. Returns a downloadable Blob. */
export function exportDcaJson(): Blob {
  const entries = loadDcaEntries();

  const exportData = {
    exportedAt: new Date().toISOString(),
    version: "0.1.0",
    dcaEntries: entries,
  };

  return new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json",
  });
}

/** Export DCA entries as CSV. Returns a downloadable Blob. */
export function exportDcaCsv(): Blob {
  const entries = loadDcaEntries();

  const header = "id,asset,amount,price_at_purchase,total_cost,date,notes";
  const rows = entries.map((e) =>
    [
      e.id,
      e.asset,
      e.amount.toString(),
      e.priceAtPurchase.toString(),
      e.totalCost.toString(),
      e.date,
      `"${(e.notes ?? "").replace(/"/g, '""')}"`,
    ].join(",")
  );

  const csv = [header, ...rows].join("\n");
  return new Blob([csv], { type: "text/csv" });
}

/** Trigger a file download in the browser. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();

  // Cleanup
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 100);
}

/** Import DCA entries from a JSON file. Returns the count of imported entries. */
export function importDcaJson(jsonString: string): number {
  const importSchema = z.object({
    version: z.string(),
    dcaEntries: z.array(
      z.object({
        id: z.string().uuid(),
        asset: z.string().min(1).max(20),
        amount: z.number().positive(),
        priceAtPurchase: z.number().positive(),
        totalCost: z.number().positive(),
        date: z.string().datetime(),
        notes: z.string().max(256).optional(),
      })
    ),
  });

  const data: unknown = JSON.parse(jsonString);
  const parsed = importSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("Invalid DCA export file format");
  }

  // Merge with existing entries, skip duplicates by ID
  const existing = loadDcaEntries();
  const existingIds = new Set(existing.map((e) => e.id));
  const newEntries = parsed.data.dcaEntries.filter(
    (e: DCAEntry) => !existingIds.has(e.id)
  );

  const merged = [...existing, ...newEntries];
  localStorage.setItem("vaultview_dca_entries", JSON.stringify(merged));

  return newEntries.length;
}
