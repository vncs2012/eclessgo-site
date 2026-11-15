import { useTranslations } from "next-intl";

import { CommunitySection } from "@/components/site/community-section";
import { PixKeyDonationCard } from "@/components/site/pix-key-donation-card";

/**
 * Contribuir: PIX direto da comunidade (QR + chave). Só existe com doações ativas E chave
 * cadastrada. Não há processamento de pagamento aqui (a frente de cobrança está pausada).
 */
export function CommunityContribute({
  churchId,
  churchName,
  slug,
  pixKey,
  donationsEnabled,
}: {
  churchId: string;
  churchName: string;
  slug: string;
  pixKey: string | null;
  donationsEnabled: boolean;
}) {
  const t = useTranslations("communityPage.contribute");

  if (!donationsEnabled || !pixKey) return null;

  return (
    <CommunitySection id="contribuir" title={t("title")}>
      <PixKeyDonationCard churchId={churchId} churchName={churchName} slug={slug} pixKey={pixKey} />
    </CommunitySection>
  );
}
