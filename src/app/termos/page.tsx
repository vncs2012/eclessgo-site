import type { Metadata } from "next";

import { LegalDocument } from "@/components/site/legal-document";
import { formatLegalEffectiveDate, LEGAL_TERMS_VERSION } from "@/lib/legal";
import { SITE_URL } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Termos de Uso | EclessGO",
  description: "Termos de Uso do EclessGO.",
  alternates: { canonical: "/termos" },
  openGraph: { title: "Termos de Uso | EclessGO", url: `${SITE_URL}/termos`, type: "website" },
};

export default function TermsPage() {
  return (
    <LegalDocument
      title="Termos de Uso"
      version={LEGAL_TERMS_VERSION}
      effectiveAt={formatLegalEffectiveDate(LEGAL_TERMS_VERSION)}
      intro="Estes termos explicam as regras para usar o EclessGO, cadastrar uma comunidade e participar das experiências públicas e autenticadas da plataforma."
      sections={[
        {
          title: "1. O serviço",
          paragraphs: [
            "O EclessGO oferece descoberta pública de comunidades, páginas informativas, recursos de participação e ferramentas administrativas. Algumas integrações, como pagamentos e notificações, podem depender de fornecedores especializados.",
            "O cadastro de uma comunidade não garante publicação imediata. Informações podem passar por revisão para proteger visitantes, comunidades e a qualidade do diretório.",
          ],
        },
        {
          title: "2. Conta e responsabilidade",
          paragraphs: [
            "Você deve fornecer informações verdadeiras, manter suas credenciais protegidas e comunicar uso não autorizado. A conta administrativa deve ser usada apenas por pessoas autorizadas pela comunidade.",
            "Não use a plataforma para fraude, assédio, discriminação, exploração, tentativa de invasão, spam ou publicação de conteúdo que viole direitos de terceiros.",
          ],
        },
        {
          title: "3. Conteúdo e comunidade",
          paragraphs: [
            "Você mantém os direitos sobre o conteúdo enviado, mas autoriza o EclessGO a armazená-lo, exibi-lo nos canais escolhidos e processá-lo para operar o serviço. Você declara ter autorização para enviar esse material.",
            "Podemos limitar, suspender ou remover conteúdo e contas que violem estes termos, a lei ou requisitos de segurança, preservando registros necessários para auditoria e suporte.",
          ],
        },
        {
          title: "4. Alterações e contato",
          paragraphs: [
            "Podemos alterar funcionalidades e estes termos. Quando uma alteração for material, publicaremos uma nova versão e poderemos solicitar novo aceite antes de continuar determinados fluxos.",
            "O uso continuado após a vigência de uma nova versão depende do aceite quando ele for solicitado pela plataforma.",
          ],
        },
      ]}
    />
  );
}
