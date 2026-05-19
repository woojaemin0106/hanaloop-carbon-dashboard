import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "하나루프 탄소 대시보드",
  description: "회사별 탄소 배출량과 탄소세 노출을 확인하는 대시보드",
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
