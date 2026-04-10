import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import { LayoutWrapper } from "@/components/layout-wrapper";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Same Day — POS Partner API Portal",
  description: "POS transaction dashboard for Same Day Solution partners",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50/60">
        <Suspense fallback={<div className="flex flex-1 min-h-screen" />}>
          <LayoutWrapper>{children}</LayoutWrapper>
        </Suspense>
      </body>
    </html>
  );
}
