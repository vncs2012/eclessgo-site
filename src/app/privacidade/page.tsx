import type { Metadata } from "next";

import { LegalDocument } from "@/components/site/legal-document";
import { formatLegalEffectiveDate, LEGAL_PRIVACY_VERSION } from "@/lib/legal";
import { SITE_URL } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Política de Privacidade | EclessGO",
  description: "Política de Privacidade do EclessGO.",
  alternates: { canonical: "/privacidade" },
  openGraph: { title: "Política de Privacidade | EclessGO", url: `${SITE_URL}/privacidade`, type: "website" },
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Política de Privacidade"
      version={LEGAL_PRIVACY_VERSION}
      effectiveAt={formatLegalEffectiveDate(LEGAL_PRIVACY_VERSION)}
      intro="Esta política explica quais dados o EclessGO utiliza, para quais finalidades, por quanto tempo e quais controles estão disponíveis para você."
      sections={[
        {
          title: "1. Dados utilizados",
          paragraphs: [
            "Podemos tratar dados de cadastro, contato, preferências, participação em comunidades, registros técnicos e informações fornecidas por administradores de comunidades. Alguns dados podem revelar vínculo religioso ou comunitário e recebem controles reforçados de acesso.",
            "No diretório público, exibimos apenas informações configuradas para publicação pela comunidade e aprovadas pelos fluxos de revisão aplicáveis.",
          ],
        },
        {
          title: "2. Finalidades",
          paragraphs: [
            "Usamos os dados para criar e proteger contas, entregar recursos solicitados, publicar informações autorizadas, enviar notificações escolhidas, prevenir abuso, atender suporte e cumprir obrigações legais.",
            "Medições opcionais de produto ficam condicionadas às escolhas de privacidade disponíveis no site. Não usamos dados sensíveis para publicidade comportamental sem uma decisão específica e documentada.",
          ],
        },
        {
          title: "3. Compartilhamento, segurança e retenção",
          paragraphs: [
            "Compartilhamos o mínimo necessário com provedores que hospedam, entregam notificações ou processam uma operação solicitada. Esses fornecedores recebem instruções contratuais e técnicas compatíveis com a finalidade.",
            "Aplicamos controles de acesso, armazenamento protegido de credenciais, logs de auditoria e retenção limitada. Incidentes relevantes seguem o processo de resposta e comunicação aplicável.",
          ],
        },
        {
          title: "4. Seus direitos",
          paragraphs: [
            "Você pode solicitar confirmação, acesso, correção, eliminação quando aplicável, informação sobre uso e revisão de preferências, observadas as exceções legais e os registros necessários para segurança.",
            "Para exercer direitos ou esclarecer esta política, use o canal de suporte indicado no produto. Podemos solicitar informações para confirmar a identidade e proteger a conta.",
          ],
        },
      ]}
    />
  );
}
