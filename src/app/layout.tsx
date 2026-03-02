import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "My Journa",
  description: "A secure personal journal with AI writing copilot capabilities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
