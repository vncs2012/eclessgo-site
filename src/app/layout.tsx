import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { ConsentBanner } from "@/components/site/consent-banner";
import { DEFAULT_THEME, THEME_COOKIE, THEME_INIT_SCRIPT, resolveTheme } from "@/components/site/theme";
import { SITE_URL } from "@/lib/site-config";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono-loaded",
  display: "swap",
});

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
  const theme = resolveTheme((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <html
      lang={locale}
      data-theme={theme === DEFAULT_THEME ? undefined : theme}
      suppressHydrationWarning
      className={`${geist.variable} ${jakarta.variable} ${geistMono.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          {children}
          <ConsentBanner />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
