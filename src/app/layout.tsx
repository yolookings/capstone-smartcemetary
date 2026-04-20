import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import Header from "@/components/header";
import ChatWidget from "@/components/chat-widget";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Smart Cemetery - The Living Memory",
  description: "Sistem Manajemen Pemakaman Digital Modern",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${manrope.variable} ${inter.variable} antialiased min-h-screen font-inter bg-neutral text-slate-900`}
      >
        <Providers>
          <Header />
          <main>{children}</main>
          <ChatWidget />
        </Providers>
      </body>
    </html>
  );
}
