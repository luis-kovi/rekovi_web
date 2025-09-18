import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../src/styles/globals.css";

// Forçar renderização dinâmica em todo o app
export const dynamic = 'force-dynamic'
export const revalidate = 0

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rekovi Web - Gestão de Recolhas",
  description: "Aplicação moderna e profissional para gestão de recolhas Kovi",
  keywords: ["kovi", "recolhas", "gestão", "logística"],
  authors: [{ name: "Kovi Team" }],
  creator: "Kovi",
  publisher: "Kovi",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    title: "Rekovi Web - Gestão de Recolhas",
    description: "Aplicação moderna e profissional para gestão de recolhas Kovi",
    siteName: "Rekovi Web",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rekovi Web - Gestão de Recolhas",
    description: "Aplicação moderna e profissional para gestão de recolhas Kovi",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  icons: {
    icon: [
      { url: "/images/icons/favicon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/images/icons/favicon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/images/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#FF355A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Rekovi Web" />
        <link rel="apple-touch-icon" href="/images/icons/apple-touch-icon.png" />
        <link rel="mask-icon" href="/images/icons/safari-pinned-tab.svg" color="#FF355A" />
        <meta name="msapplication-TileColor" content="#FF355A" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <div id="root" className="relative flex min-h-screen flex-col">
          {children}
        </div>
        <div id="modal-root" />
        <div id="toast-root" />
      </body>
    </html>
  );
}