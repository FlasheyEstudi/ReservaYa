import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { WebSocketProvider } from "@/components/providers/WebSocketProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReservaYa - Sistema de Reservas de Restaurantes",
  description: "Sistema completo de reservas de restaurantes con gestión en tiempo real para clientes y personal",
  keywords: ["reservas", "restaurantes", "sistema", "gestión", "real-time", "Next.js", "TypeScript"],
  authors: [{ name: "ReservaYa Team" }],
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: "ReservaYa - Sistema de Reservas",
    description: "Sistema completo de reservas de restaurantes con gestión en tiempo real",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReservaYa - Sistema de Reservas",
    description: "Sistema completo de reservas de restaurantes con gestión en tiempo real",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <WebSocketProvider>
          {children}
          <Toaster />
        </WebSocketProvider>
      </body>
    </html>
  );
}
