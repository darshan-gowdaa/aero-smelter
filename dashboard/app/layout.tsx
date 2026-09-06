import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import "remixicon/fonts/remixicon.css";
import { ThemeProvider } from "@/lib/theme";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ASG Airlines | Executive Operations Suite",
  description:
    "Executive Flight Operations Analytics Suite - Medallion Architecture with MD3 Expressive Claymorphism & Star Schema Gold Layer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
