import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Providers from "@/components/Providers";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Base for absolute URLs in link previews; set NEXT_PUBLIC_SITE_URL to the public site address in production.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Cinema Dharshak Manch",
  description: "Directors share updates from their films. Audiences like, rate and share their thoughts.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>
          <Suspense fallback={<div className="h-16 bg-surface border-b border-line" />}>
            <Header />
          </Suspense>
          <main className="flex-1">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
