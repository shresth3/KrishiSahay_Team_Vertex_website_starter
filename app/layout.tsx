import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KrishiSahay | Smarter Selling. Better Returns.",
  description: "Compare mandis, estimate net earnings, and coordinate shared transport for smallholder farmers."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
