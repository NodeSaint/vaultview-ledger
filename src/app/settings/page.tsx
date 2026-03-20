"use client";

import { useState, useEffect, useCallback } from "react";
import { Shell, Prompt } from "@/components/terminal";
import { loadSettings, saveSettings, resetSettings, DEFAULT_SETTINGS } from "@/lib/settings";
import { validateRpcUrl } from "@/lib/security";
import type { Settings } from "@/lib/schemas";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rpcTestResults, setRpcTestResults] = useState<Record<string, string>>({});

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const handleSave = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (settings.ethRpcUrl) {
      try {
        validateRpcUrl(settings.ethRpcUrl);
      } catch (err) {
        newErrors.ethRpcUrl = err instanceof Error ? err.message : "Invalid URL";
      }
    }

    if (settings.solRpcUrl) {
      try {
        validateRpcUrl(settings.solRpcUrl);
      } catch (err) {
        newErrors.solRpcUrl = err instanceof Error ? err.message : "Invalid URL";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => { setSaved(false); }, 2000);
  }, [settings]);

  const handleReset = useCallback(() => {
    resetSettings();
    setSettings(DEFAULT_SETTINGS);
    setErrors({});
    setRpcTestResults({});
  }, []);

  const testRpc = useCallback(async (type: "eth" | "sol") => {
    const url = type === "eth" ? settings.ethRpcUrl : settings.solRpcUrl;
    if (!url) return;

    const key = `${type}RpcUrl`;
    setRpcTestResults((prev) => ({ ...prev, [key]: "TESTING..." }));

    try {
      const method = type === "eth" ? "eth_blockNumber" : "getSlot";
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method, params: [], id: 1 }),
        signal: AbortSignal.timeout(10_000),
      });

      if (response.ok) {
        setRpcTestResults((prev) => ({ ...prev, [key]: "OK" }));
      } else {
        setRpcTestResults((prev) => ({
          ...prev,
          [key]: `FAIL (${String(response.status)})`,
        }));
      }
    } catch {
      setRpcTestResults((prev) => ({ ...prev, [key]: "FAIL (timeout/network)" }));
    }
  }, [settings]);

  return (
    <Shell>
      <Prompt label="settings">
        <span className="text-phosphor">Configuration</span>
      </Prompt>

      <div className="space-y-6 text-sm">
        {/* RPC Configuration */}
        <section>
          <h2 className="mb-2 text-amber">─── RPC ENDPOINTS ───</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-text-dim">
                ETHEREUM RPC (leave empty for default):
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  type="url"
                  value={settings.ethRpcUrl ?? ""}
                  onChange={(e) => {
                    setSettings({ ...settings, ethRpcUrl: e.target.value || undefined });
                  }}
                  placeholder="https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY"
                  className="flex-1 border border-border bg-surface px-2 py-1 font-mono text-phosphor placeholder:text-grey"
                />
                <button
                  onClick={() => void testRpc("eth")}
                  className="border border-border px-2 text-text-dim hover:text-phosphor"
                >
                  [TEST]
                </button>
              </div>
              {errors.ethRpcUrl && (
                <span className="text-red text-xs">{errors.ethRpcUrl}</span>
              )}
              {rpcTestResults.ethRpcUrl && (
                <span
                  className={`text-xs ${rpcTestResults.ethRpcUrl === "OK" ? "text-phosphor" : rpcTestResults.ethRpcUrl === "TESTING..." ? "text-amber" : "text-red"}`}
                >
                  {" "}{rpcTestResults.ethRpcUrl}
                </span>
              )}
            </div>

            <div>
              <label className="block text-text-dim">
                SOLANA RPC (leave empty for default):
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  type="url"
                  value={settings.solRpcUrl ?? ""}
                  onChange={(e) => {
                    setSettings({ ...settings, solRpcUrl: e.target.value || undefined });
                  }}
                  placeholder="https://api.mainnet-beta.solana.com"
                  className="flex-1 border border-border bg-surface px-2 py-1 font-mono text-phosphor placeholder:text-grey"
                />
                <button
                  onClick={() => void testRpc("sol")}
                  className="border border-border px-2 text-text-dim hover:text-phosphor"
                >
                  [TEST]
                </button>
              </div>
              {errors.solRpcUrl && (
                <span className="text-red text-xs">{errors.solRpcUrl}</span>
              )}
              {rpcTestResults.solRpcUrl && (
                <span
                  className={`text-xs ${rpcTestResults.solRpcUrl === "OK" ? "text-phosphor" : rpcTestResults.solRpcUrl === "TESTING..." ? "text-amber" : "text-red"}`}
                >
                  {" "}{rpcTestResults.solRpcUrl}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Price Settings */}
        <section>
          <h2 className="mb-2 text-amber">─── PRICE FEED ───</h2>
          <label className="block text-text-dim">
            POLL INTERVAL (seconds):
            <input
              type="number"
              value={settings.pricePollIntervalMs / 1000}
              onChange={(e) => {
                const seconds = Math.max(10, Math.min(600, parseInt(e.target.value) || 60));
                setSettings({ ...settings, pricePollIntervalMs: seconds * 1000 });
              }}
              min={10}
              max={600}
              className="ml-2 w-20 border border-border bg-surface px-2 py-1 font-mono text-phosphor"
            />
          </label>
        </section>

        {/* Display Settings */}
        <section>
          <h2 className="mb-2 text-amber">─── DISPLAY ───</h2>
          <label className="flex items-center gap-2 text-text-dim">
            <input
              type="checkbox"
              checked={settings.enableScanlines}
              onChange={(e) => {
                setSettings({ ...settings, enableScanlines: e.target.checked });
              }}
              className="accent-phosphor"
            />
            CRT Scanlines
          </label>
          <label className="mt-1 flex items-center gap-2 text-text-dim">
            <input
              type="checkbox"
              checked={settings.enableFlicker}
              onChange={(e) => {
                setSettings({ ...settings, enableFlicker: e.target.checked });
              }}
              className="accent-phosphor"
            />
            Screen Flicker
          </label>
        </section>

        {/* Actions */}
        <div className="flex gap-3 border-t border-border pt-4">
          <button
            onClick={handleSave}
            className="border border-phosphor px-4 py-1 text-phosphor hover:bg-phosphor hover:text-surface"
          >
            [SAVE]
          </button>
          <button
            onClick={handleReset}
            className="border border-red px-4 py-1 text-red hover:bg-red hover:text-surface"
          >
            [RESET TO DEFAULTS]
          </button>
          <a
            href="/"
            className="border border-border px-4 py-1 text-text-dim hover:text-phosphor"
          >
            [BACK]
          </a>
          {saved && (
            <span className="py-1 text-phosphor">Settings saved.</span>
          )}
        </div>
      </div>
    </Shell>
  );
}
