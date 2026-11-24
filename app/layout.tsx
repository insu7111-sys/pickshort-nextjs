
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://pickshort-nextjs-y3hl.vercel.app"),

  title: "픽숏 PickShort | 추천 상품 숏츠 쇼핑",

  description: "픽숏(PickShort)은 건강, 미용, 생활, 가전·도구 추천 상품을 숏츠 영상으로 소개합니다. 유용한 상품 정보를 확인하고 쿠팡에서 간편하게 쇼핑하세요.",

  applicationName: "픽숏 PickShort",

  keywords: [
    "픽숏",
    "PickShort",
    "숏츠 쇼핑",
    "추천 상품",
    "쿠팡 추천 상품",
    "쿠팡 파트너스",
    "건강용품",
    "미용용품",
    "생활용품",
    "가전제품",
    "생활 아이디어 상품",
    "쇼핑 숏츠",
  ],

  alternates: {
    canonical: "/",
  },

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    title: "픽숏 PickShort | 추천 상품 숏츠 쇼핑",
    description: "건강, 미용, 생활, 가전·도구 추천 상품을 숏츠 영상으로 만나보세요.",
    url: "https://pickshort-nextjs-y3hl.vercel.app",
    siteName: "픽숏 PickShort",
    locale: "ko_KR",
    type: "website",
  },

  twitter: {
    card: "summary",
    title: "픽숏 PickShort | 추천 상품 숏츠 쇼핑",
    description: "짧게 보고 똑똑하게 쇼핑! 픽숏에서 추천 상품을 만나보세요.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
