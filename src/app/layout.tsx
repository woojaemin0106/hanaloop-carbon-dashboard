import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HanaLoop Carbon Dashboard",
  description: "PCF lifecycle dashboard for carbon management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
