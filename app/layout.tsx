import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

const description =
  "Un profesor con IA que te prepara la oposición: practica lo que necesitas, mide tu absorción y estudia con fuente verificada.";

export const metadata: Metadata = {
  metadataBase: new URL("https://acertium.es"),
  title: "Acertium",
  description,
  openGraph: {
    title: "Acertium",
    description,
    url: "https://acertium.es",
    siteName: "Acertium",
    locale: "es_ES",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Acertium", description },
};

export const viewport: Viewport = {
  themeColor: "#1D9E75",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${jakarta.variable}`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
