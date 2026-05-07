import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Grana 3D · Impresión 3D de calidad",
    template: "%s | Grana 3D",
  },
  description: "Productos diseñados e impresos en 3D con atención al detalle y materiales de primera. Envíos a todo el país.",
  keywords: ["impresión 3d", "grana 3d", "diseño 3d", "tienda online", "argentina"],
  authors: [{ name: "Julian Cancelo", url: "https://www.juliancancelo.com.ar" }],
  creator: "Julian Cancelo",
  publisher: "Grana 3D",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://www.grana3d.com.ar"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Grana 3D · Impresión 3D de calidad",
    description: "Productos diseñados e impresos en 3D con atención al detalle y materiales de primera.",
    url: "https://www.grana3d.com.ar",
    siteName: "Grana 3D",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Grana 3D - Impresión 3D de calidad",
      },
    ],
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Grana 3D · Impresión 3D de calidad",
    description: "Productos diseñados e impresos en 3D con atención al detalle.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/logo-grana3d.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [
      { url: "/logo-grana3d.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/logo-grana3d.svg",
        color: "#e17055",
      },
    ],
  },
  manifest: "/site.webmanifest",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
