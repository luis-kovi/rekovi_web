// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

// Forçar renderização dinâmica em todo o app
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: "Gestão de Recolhas - Kovi",
  description: "Aplicação para gestão de recolhas Kovi",
  icons: {
    icon: "https://i.ibb.co/ksMQSMQ2/web-app-manifest-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}