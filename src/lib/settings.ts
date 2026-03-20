import { settingsSchema } from "@/lib/schemas";
import type { Settings } from "@/lib/schemas";

const STORAGE_KEY = "vaultview_settings";

const DEFAULT_SETTINGS: Settings = {
  ethRpcUrl: undefined,
  solRpcUrl: undefined,
  pricePollIntervalMs: 60_000,
  enableScanlines: true,
  enableFlicker: true,
};

/** Load settings from localStorage with Zod validation. */
export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;

    const json: unknown = JSON.parse(raw);
    const parsed = settingsSchema.safeParse(json);

    if (!parsed.success) {
      localStorage.removeItem(STORAGE_KEY);
      return DEFAULT_SETTINGS;
    }

    return parsed.data;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Save settings to localStorage. */
export function saveSettings(settings: Settings): void {
  const validated = settingsSchema.parse(settings);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
}

/** Reset settings to defaults. */
export function resetSettings(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export { DEFAULT_SETTINGS };
