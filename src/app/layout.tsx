import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VaultView",
  description:
    "Hardware-wallet-connected portfolio tracker with a retro terminal aesthetic.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface font-mono text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
