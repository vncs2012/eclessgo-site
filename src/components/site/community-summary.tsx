import { Clock3, MapPin, MessageSquare } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { CommunityActionButtons } from "@/components/site/community-actions";
import type { CommunityAddress, CommunityContact, MessageAction } from "@/lib/public-community-page";

type CommunitySummaryProps = {
  address: CommunityAddress;
  /** Primeira linha em destaque e as demais num texto só; nulo sem horários. */
  schedule: { main: string; rest: string | null } | null;
  contact: CommunityContact;
  /** "@perfil" do Instagram, quando houver. */
  instagram: string | null;
  directionsUrl: string | null;
  message: MessageAction | null;
};

const CELL = "flex min-w-0 items-start gap-3 lg:flex-1 bg-eg-surface px-4 py-3.5 md:px-5 md:py-[18px]";

function Fact({
  icon: Icon,
  label,
  main,
  sub,
  className = "",
}: {
  icon: typeof MapPin;
  label: string;
  main: string;
  sub: string | null;
  className?: string;
}) {
  return (
    <div className={`${CELL} ${className}`}>
      <Icon className="mt-[3px] h-[18px] w-[18px] shrink-0 text-eg-primary-text" aria-hidden="true" />
      <div className="min-w-0">
        <p className="mb-0.5 text-[11.5px] font-bold uppercase tracking-[0.07em] text-eg-muted">{label}</p>
        <p className="break-words text-[15px] font-bold leading-snug text-eg-strong">{main}</p>
        {sub ? <p className="break-words text-[13.5px] text-eg-muted">{sub}</p> : null}
      </div>
    </div>
  );
}

/** Faixa-resumo logo abaixo da foto. Cada célula só existe se o dado existir. */
export function CommunitySummary({
  address,
  schedule,
  contact,
  instagram,
  directionsUrl,
  message,
}: CommunitySummaryProps) {
  const t = useTranslations("communityPage.summary");

  const channels: string[] = [];
  if (contact.whatsapp) channels.push(t("whatsapp", { value: contact.whatsapp.display }));
  if (contact.phone) channels.push(t("phone", { value: contact.phone.display }));
  if (contact.email) channels.push(contact.email);
  if (instagram) channels.push(t("instagram", { value: instagram }));

  const facts: Array<{ key: string; node: (className: string) => ReactNode }> = [];
  if (address.hasAddress) {
    facts.push({
      key: "address",
      node: (className) => (
        <Fact
          key="address"
          icon={MapPin}
          label={t("address")}
          main={address.street}
          sub={address.locality}
          className={className}
        />
      ),
    });
  }
  if (schedule) {
    facts.push({
      key: "schedule",
      node: (className) => (
        <Fact
          key="schedule"
          icon={Clock3}
          label={t("schedule")}
          main={schedule.main}
          sub={schedule.rest}
          className={className}
        />
      ),
    });
  }
  if (channels.length > 0) {
    facts.push({
      key: "contact",
      // Celular: só endereço e horários; o contato fica na barra fixa e na seção Contato
      // (a menos que não haja mais nada para mostrar na faixa).
      node: (className) => (
        <Fact
          key="contact"
          icon={MessageSquare}
          label={t("contact")}
          main={channels[0]}
          sub={channels[1] ?? null}
          className={`${address.hasAddress || schedule ? "max-md:hidden" : ""} ${className}`}
        />
      ),
    });
  }

  const hasActions = Boolean(directionsUrl || message);
  if (facts.length === 0 && !hasActions) return null;

  const odd = facts.length % 2 === 1;

  return (
    <section
      aria-label={t("label")}
      className="relative z-10 -mt-7 mb-0 grid gap-px overflow-hidden rounded-2xl border border-eg-border bg-eg-border shadow-[var(--eg-shadow-1)] md:mt-4 md:rounded-[20px] md:grid-cols-2 lg:flex"
    >
      {facts.map((fact, index) =>
        fact.node(index === facts.length - 1 && odd ? "md:col-span-2 lg:col-span-1" : ""),
      )}
      {hasActions ? (
        <div className="flex gap-2 bg-eg-surface px-[18px] py-3.5 max-md:hidden md:col-span-2 lg:shrink-0 lg:flex-col lg:justify-center">
          <CommunityActionButtons directionsUrl={directionsUrl} message={message} variant="summary" />
        </div>
      ) : null}
    </section>
  );
}
