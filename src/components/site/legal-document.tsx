import Link from "next/link";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

export type LegalSection = {
  title: string;
  paragraphs: string[];
};

type LegalDocumentProps = {
  title: string;
  version: string;
  effectiveAt: string;
  intro: string;
  sections: LegalSection[];
};

export function LegalDocument({ title, version, effectiveAt, intro, sections }: LegalDocumentProps) {
  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <Link href="/" className="text-sm text-emerald-300 underline-offset-4 hover:underline">
          ← Voltar para EclessGO
        </Link>
        <header className="mt-8 border-b border-white/10 pb-8">
          <p className="text-xs uppercase tracking-[0.24em] text-emerald-300">Documento vigente</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">{title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-300">{intro}</p>
          <p className="mt-4 text-xs text-zinc-500">
            Versão {version} · Vigente desde {effectiveAt}
          </p>
        </header>

        <div className="space-y-10 py-10">
          {sections.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="text-xl font-semibold text-white">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-7 text-zinc-300">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5 text-sm leading-6 text-zinc-300">
          Dúvidas sobre estes documentos? Entre em contato pelo canal de suporte informado no produto antes de criar ou utilizar uma conta.
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
