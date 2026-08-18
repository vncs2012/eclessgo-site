import type { Metadata } from "next";
import ChurchesPage from "../igrejas/page";
import { SITE_URL } from "@/lib/site-config";

export const revalidate = 120;
export const metadata: Metadata = {
  title: "Comunidades | EclessGO",
  description:
    "Explore comunidades no mapa público do EclessGO, filtre por cidade, bairro, categoria e descubra espaços ativos perto de você.",
  alternates: {
    canonical: "/comunidades",
  },
  openGraph: {
    title: "Comunidades | EclessGO",
    description:
      "Explore comunidades no mapa público do EclessGO, filtre por cidade, bairro, categoria e descubra espaços ativos perto de você.",
    url: `${SITE_URL}/comunidades`,
    type: "website",
  },
};

export default function CommunitiesPage() {
  return <ChurchesPage />;
}
