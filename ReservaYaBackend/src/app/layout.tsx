import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReservaYA - API Backend",
  description: "Sistema completo de reservas de restaurantes - Backend API con gestión en tiempo real",
  keywords: ["ReservaYA", "reservas", "restaurantes", "API", "Next.js", "TypeScript", "Prisma"],
  authors: [{ name: "ReservaYA Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "ReservaYA - API Backend",
    description: "Sistema completo de reservas de restaurantes - Backend API",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReservaYA - API Backend",
    description: "Sistema completo de reservas de restaurantes - Backend API",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
