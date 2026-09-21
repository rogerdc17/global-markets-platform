import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DP Alpha Terminal",
  description: "Private trading intelligence for live markets, portfolio tracking and AI-assisted research.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
