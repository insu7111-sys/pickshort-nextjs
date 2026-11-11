import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "픽숏 | 짧게 보고 똑똑하게 쇼핑",
  description: "숏츠 스타일로 발견하는 생활 아이디어 상품",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
