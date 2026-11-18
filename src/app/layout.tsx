import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Salary — трекер личных финансов",
  description: "Быстрый и наглядный учёт доходов и расходов.",
};

export const viewport: Viewport = {
  themeColor: "#0A0F1D",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`dark ${inter.variable} ${geistMono.variable}`}>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
