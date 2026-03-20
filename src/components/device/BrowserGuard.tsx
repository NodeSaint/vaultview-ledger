"use client";

import { useEffect, useState } from "react";

interface BrowserGuardProps {
  children: React.ReactNode;
}

export function BrowserGuard({ children }: BrowserGuardProps) {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    setSupported("hid" in navigator);
  }, []);

  // SSR / loading — render nothing until we know
  if (supported === null) {
    return (
      <div className="py-4 text-text-dim text-sm">
        <span>Checking browser compatibility</span>
        <span className="ml-1 inline-block animate-pulse">...</span>
      </div>
    );
  }

  if (!supported) {
    return (
      <div className="border border-red p-4 text-sm" role="alert">
        <p className="mb-2 text-red font-bold">
          ✘ UNSUPPORTED BROWSER
        </p>
        <p className="text-text-dim">
          VaultView requires WebHID, which is only available in Chromium-based
          browsers (Chrome, Edge, Brave, Arc, Opera).
        </p>
        <p className="mt-2 text-text-dim">
          Firefox and Safari are not supported.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
