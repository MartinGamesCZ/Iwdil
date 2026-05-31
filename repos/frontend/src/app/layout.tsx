import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Plus_Jakarta_Sans,
  Figtree,
  Rouge_Script,
  Playfair_Display,
} from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthenticationGuard } from "@/guards/AuthenticationGuard";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree" });

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
});

const rougeScript = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "Iwdil",
  description: "I Will Do It Later",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        plusJakartaSans.variable,
        "font-sans",
        figtree.variable,
        rougeScript.variable,
        "dark",
      )}
    >
      <body className="min-h-full flex flex-col">
        <AuthenticationGuard>{children}</AuthenticationGuard>
      </body>
    </html>
  );
}
