import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Dirac & Broglie",
  description: "Dirac & Broglie Family Office Internal Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.variable} antialiased`} style={{ fontFamily: "var(--font-inter), 'Noto Sans KR', Arial, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
