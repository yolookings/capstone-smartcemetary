import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import Header from "@/components/header";
import Footer from "@/components/footer";
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

const siteUrl = "https://smartcemetary.web.id";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Smart Cemetery",
  description:
    "Sistem manajemen pemakaman digital modern — daftar makam online, verifikasi dokumen, monitoring lokasi, dan tracking status pengajuan secara real-time.",
  icons: [
    { rel: "icon", url: "/logo-smartcemetary.png", type: "image/png" },
    { rel: "shortcut icon", url: "/logo-smartcemetary.png", type: "image/png" },
  ],
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Smart Cemetery",
    title: "Smart Cemetery",
    description:
      "Sistem manajemen pemakaman digital modern — daftar makam online, verifikasi dokumen, monitoring lokasi, dan tracking status pengajuan secara real-time.",
    images: [
      {
        url: "/logo-smartcemetary.png",
        width: 512,
        height: 512,
        alt: "Smart Cemetery",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart Cemetery",
    description:
      "Sistem manajemen pemakaman digital modern — daftar makam online, verifikasi dokumen, monitoring lokasi, dan tracking status pengajuan secara real-time.",
    images: ["/logo-smartcemetary.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${manrope.variable} ${inter.variable} antialiased min-h-screen font-inter bg-neutral text-slate-900 flex flex-col`}
      >
        <Providers>
          <Header />
          <main className="flex-1 pb-24 lg:pb-32">{children}</main>
          <Footer />
          <ChatWidget />
        </Providers>
      </body>
    </html>
  );
}