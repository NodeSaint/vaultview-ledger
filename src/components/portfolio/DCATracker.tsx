"use client";

import { useState, useCallback, useEffect } from "react";
import {
  loadDcaEntries,
  addDcaEntry,
  deleteDcaEntry,
  calculateCostBasis,
  calculateUnrealisedPnl,
  exportDcaCsv,
  exportDcaJson,
  downloadBlob,
} from "@/lib/portfolio";
import type { DCAEntry } from "@/lib/schemas";
import type { PriceData } from "@/lib/prices";
import { formatUsd, formatPercent } from "@/lib/portfolio";

interface DCATrackerProps {
  prices: PriceData[];
}

export function DCATracker({ prices }: DCATrackerProps) {
  const [entries, setEntries] = useState<DCAEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    asset: "",
    amount: "",
    priceAtPurchase: "",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  useEffect(() => {
    setEntries(loadDcaEntries());
  }, []);

  const priceMap = new Map(prices.map((p) => [p.symbol.toUpperCase(), p.usd]));

  const handleSubmit = useCallback(() => {
    const amount = parseFloat(formData.amount);
    const price = parseFloat(formData.priceAtPurchase);

    if (!formData.asset || isNaN(amount) || isNaN(price) || amount <= 0 || price <= 0) {
      return;
    }

    addDcaEntry({
      asset: formData.asset.toUpperCase(),
      amount,
      priceAtPurchase: price,
      date: new Date(formData.date).toISOString(),
      notes: formData.notes || undefined,
    });

    setEntries(loadDcaEntries());
    setFormData({
      asset: "",
      amount: "",
      priceAtPurchase: "",
      date: new Date().toISOString().slice(0, 10),
      notes: "",
    });
    setShowForm(false);
  }, [formData]);

  const handleDelete = useCallback((id: string) => {
    deleteDcaEntry(id);
    setEntries(loadDcaEntries());
  }, []);

  const handleExportCsv = useCallback(() => {
    const blob = exportDcaCsv();
    downloadBlob(blob, `vaultview-dca-${new Date().toISOString().slice(0, 10)}.csv`);
  }, []);

  const handleExportJson = useCallback(() => {
    const blob = exportDcaJson();
    downloadBlob(blob, `vaultview-dca-${new Date().toISOString().slice(0, 10)}.json`);
  }, []);

  // Get unique assets for summary
  const assets = [...new Set(entries.map((e) => e.asset.toUpperCase()))];

  return (
    <div className="mt-6">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-text-dim">┌─ DCA TRACKER</span>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowForm(!showForm); }}
            className="border border-phosphor px-2 py-0.5 text-xs text-phosphor hover:bg-phosphor hover:text-surface"
          >
            [{showForm ? "CANCEL" : "+ ADD ENTRY"}]
          </button>
          {entries.length > 0 && (
            <>
              <button
                onClick={handleExportCsv}
                className="border border-border px-2 py-0.5 text-xs text-text-dim hover:text-phosphor"
              >
                [CSV]
              </button>
              <button
                onClick={handleExportJson}
                className="border border-border px-2 py-0.5 text-xs text-text-dim hover:text-phosphor"
              >
                [JSON]
              </button>
            </>
          )}
        </div>
      </div>

      {showForm && (
        <div className="mb-4 border border-border p-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <label className="block">
              <span className="text-text-dim">ASSET:</span>
              <input
                type="text"
                value={formData.asset}
                onChange={(e) => { setFormData({ ...formData, asset: e.target.value }); }}
                placeholder="ETH"
                maxLength={20}
                className="mt-1 block w-full border border-border bg-surface px-2 py-1 font-mono text-phosphor placeholder:text-grey"
              />
            </label>
            <label className="block">
              <span className="text-text-dim">AMOUNT:</span>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => { setFormData({ ...formData, amount: e.target.value }); }}
                placeholder="0.5"
                step="any"
                min="0"
                className="mt-1 block w-full border border-border bg-surface px-2 py-1 font-mono text-phosphor placeholder:text-grey"
              />
            </label>
            <label className="block">
              <span className="text-text-dim">PRICE (USD):</span>
              <input
                type="number"
                value={formData.priceAtPurchase}
                onChange={(e) => { setFormData({ ...formData, priceAtPurchase: e.target.value }); }}
                placeholder="2000"
                step="any"
                min="0"
                className="mt-1 block w-full border border-border bg-surface px-2 py-1 font-mono text-phosphor placeholder:text-grey"
              />
            </label>
            <label className="block">
              <span className="text-text-dim">DATE:</span>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => { setFormData({ ...formData, date: e.target.value }); }}
                className="mt-1 block w-full border border-border bg-surface px-2 py-1 font-mono text-phosphor"
              />
            </label>
          </div>
          <label className="mt-2 block">
            <span className="text-text-dim">NOTES (optional):</span>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => { setFormData({ ...formData, notes: e.target.value }); }}
              maxLength={256}
              className="mt-1 block w-full border border-border bg-surface px-2 py-1 font-mono text-phosphor placeholder:text-grey"
            />
          </label>
          <button
            onClick={handleSubmit}
            className="mt-2 border border-phosphor px-4 py-1 text-sm text-phosphor hover:bg-phosphor hover:text-surface"
          >
            [SAVE]
          </button>
        </div>
      )}

      {/* Summary per asset */}
      {assets.length > 0 && (
        <div className="mb-3">
          <pre className="text-sm leading-relaxed">
            {assets.map((asset) => {
              const basis = calculateCostBasis(asset);
              const currentPrice = priceMap.get(asset);
              const pnl = currentPrice
                ? calculateUnrealisedPnl(asset, currentPrice)
                : null;

              return (
                <span key={asset}>
                  <span className="text-amber">{asset.padEnd(6)}</span>
                  <span className="text-text-dim"> AVG: </span>
                  <span className="text-phosphor">
                    {formatUsd(basis.averageCost)}
                  </span>
                  <span className="text-text-dim"> │ INVESTED: </span>
                  <span className="text-phosphor">
                    {formatUsd(basis.totalInvested)}
                  </span>
                  {pnl && (
                    <>
                      <span className="text-text-dim"> │ P&L: </span>
                      <span
                        className={
                          pnl.unrealisedPnl >= 0 ? "text-phosphor" : "text-red"
                        }
                      >
                        {formatUsd(pnl.unrealisedPnl)} (
                        {formatPercent(pnl.unrealisedPnlPercent)})
                      </span>
                    </>
                  )}
                  <span className="text-text-dim">
                    {" "}
                    [{basis.entryCount} entries]
                  </span>
                  {"\n"}
                </span>
              );
            })}
          </pre>
        </div>
      )}

      {/* Recent entries list */}
      {entries.length > 0 && (
        <div className="max-h-48 overflow-y-auto text-xs">
          {entries
            .slice()
            .reverse()
            .slice(0, 20)
            .map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between border-b border-grey-dim py-1"
              >
                <div>
                  <span className="text-amber">{entry.asset}</span>
                  <span className="text-text-dim">
                    {" "}
                    {entry.amount} @ {formatUsd(entry.priceAtPurchase)}
                  </span>
                  <span className="text-text-dim">
                    {" "}
                    = {formatUsd(entry.totalCost)}
                  </span>
                  <span className="text-text-dim ml-2">
                    {new Date(entry.date).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={() => { handleDelete(entry.id); }}
                  className="text-red hover:text-red/80"
                  title="Delete entry"
                >
                  [×]
                </button>
              </div>
            ))}
        </div>
      )}

      {entries.length === 0 && !showForm && (
        <div className="py-2 text-xs text-text-dim">
          No DCA entries. Click [+ ADD ENTRY] to start tracking.
        </div>
      )}
    </div>
  );
}
