// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bula Health | Fiji Pharmacy Directory",
  description: "Find open pharmacies, contact details, and directions across Suva, Nausori, Nasinu, and Navua.",
  keywords: ["Fiji", "Pharmacy", "Health", "Suva", "Medical Directory"],
  authors: [{ name: "Bula Health Fiji" }],
  // This section controls the "Official" look in link previews
  openGraph: {
    title: "Bula Health",
    description: "Your digital gateway to healthcare services in Fiji.",
    url: "https://pharmaopen.vercel.app/",
    siteName: "Bula Health",
    images: [
      {
        url: "/og-image.png", // We'll create this in the next step
        width: 1200,
        height: 630,
        alt: "Bula Health Fiji Preview",
      },
    ],
    locale: "en_FJ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bula Health",
    description: "Fiji's leading pharmacy directory.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb", // Matches your blue-600 branding
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}