import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import type { ReactNode } from "react";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { ConsentBanner } from "@/components/site/consent-banner";
import { SITE_URL } from "@/lib/site-config";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "EclessGO | Comunidades no mapa, encontros e presença digital",
  description:
    "Descubra comunidades no mapa, conheça a plataforma EclessGO e cadastre seu espaço para aparecer no app e no painel.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "EclessGO | Comunidades no mapa, encontros e presença digital",
    description:
      "Descubra comunidades no mapa, conheça a plataforma EclessGO e cadastre seu espaço para aparecer no app e no painel.",
    url: SITE_URL,
    siteName: "EclessGO",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "EclessGO | Comunidades no mapa, encontros e presença digital",
    description:
      "Descubra comunidades no mapa, conheça a plataforma EclessGO e cadastre seu espaço para aparecer no app e no painel.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          {children}
          <ConsentBanner />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
