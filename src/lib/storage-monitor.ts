/**
 * Monitor localStorage usage and warn when approaching limits.
 * Browser limit is typically ~5-10MB.
 */

const WARN_THRESHOLD = 0.8; // 80%

export interface StorageUsage {
  usedBytes: number;
  usedKb: number;
  usedMb: number;
  isNearLimit: boolean;
}

/** Estimate current localStorage usage. */
export function getStorageUsage(): StorageUsage {
  let totalBytes = 0;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          // Each character is 2 bytes in JS (UTF-16)
          totalBytes += (key.length + value.length) * 2;
        }
      }
    }
  } catch {
    return { usedBytes: 0, usedKb: 0, usedMb: 0, isNearLimit: false };
  }

  const usedKb = totalBytes / 1024;
  const usedMb = usedKb / 1024;

  // Estimate limit at 5MB (conservative)
  const limitBytes = 5 * 1024 * 1024;
  const isNearLimit = totalBytes / limitBytes >= WARN_THRESHOLD;

  return {
    usedBytes: totalBytes,
    usedKb: Math.round(usedKb * 100) / 100,
    usedMb: Math.round(usedMb * 100) / 100,
    isNearLimit,
  };
}

/** Get usage for VaultView keys only. */
export function getVaultViewStorageUsage(): StorageUsage {
  let totalBytes = 0;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("vaultview_")) {
        const value = localStorage.getItem(key);
        if (value) {
          totalBytes += (key.length + value.length) * 2;
        }
      }
    }
  } catch {
    return { usedBytes: 0, usedKb: 0, usedMb: 0, isNearLimit: false };
  }

  const usedKb = totalBytes / 1024;
  const usedMb = usedKb / 1024;
  const limitBytes = 5 * 1024 * 1024;
  const isNearLimit = totalBytes / limitBytes >= WARN_THRESHOLD;

  return {
    usedBytes: totalBytes,
    usedKb: Math.round(usedKb * 100) / 100,
    usedMb: Math.round(usedMb * 100) / 100,
    isNearLimit,
  };
}
