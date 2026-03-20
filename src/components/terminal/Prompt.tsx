"use client";

interface PromptProps {
  label?: string;
  children: React.ReactNode;
}

export function Prompt({ label = "vaultview", children }: PromptProps) {
  return (
    <div className="mb-4">
      <div className="mb-1 flex items-center gap-2 text-sm">
        <span className="text-text-dim">┌──(</span>
        <span className="text-amber">{label}</span>
        <span className="text-text-dim">)</span>
      </div>
      <div className="flex items-start gap-2 text-sm">
        <span className="text-text-dim">└─$</span>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
