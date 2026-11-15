import { AtSign, ChevronRight, Check, Globe, Mail, MessageSquare, Phone, Play, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ComponentType, SVGProps } from "react";

import { COMMUNITY_FOCUS, CommunitySection } from "@/components/site/community-section";
import {
  EXTERNAL_LINK_REL,
  EXTERNAL_LINK_TARGET,
  type NetworkKey,
} from "@/lib/public-church-profile";
import {
  groupFeatures,
  networkDisplay,
  type CommunityContact,
} from "@/lib/public-community-page";

/** Instalações e acessibilidade (de `features`), em grupos por palavra-chave. Sem dado, não renderiza. */
export function ChurchProfileAttributes({ features }: { features: string[] }) {
  const t = useTranslations("communityPage.facilities");
  const groups = groupFeatures(features);

  if (groups.length === 0) return null;

  return (
    <CommunitySection id="instalacoes" title={t("title")}>
      <div className="grid gap-4 md:grid-cols-[repeat(auto-fit,minmax(14rem,1fr))]">
        {groups.map((group) => (
          <div key={group.key} className="rounded-2xl border border-eg-border bg-eg-surface p-[18px]">
            <h3 className="mb-2.5 text-xs font-bold uppercase tracking-[0.07em] text-eg-muted">
              {t(group.key)}
            </h3>
            <ul className="grid gap-2.5">
              {group.items.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[15px] text-eg-strong">
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-[var(--eg-feedback-success-text)]"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </CommunitySection>
  );
}

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const NETWORK_ICONS: Record<NetworkKey, Icon> = {
  website: Globe,
  instagram: AtSign,
  facebook: Users,
  youtube: Play,
};

const CARD =
  "flex min-h-16 items-center gap-3.5 rounded-2xl border border-eg-border bg-eg-surface py-2.5 pl-2.5 pr-4 font-semibold text-eg-strong transition-colors hover:border-eg-border-strong";

function ChannelCard({
  icon: IconComponent,
  label,
  value,
  href,
  external,
  track,
  ariaLabel,
}: {
  icon: Icon;
  label: string;
  value: string;
  href: string;
  external: boolean;
  track: string;
  ariaLabel: string;
}) {
  return (
    <li>
      <a
        href={href}
        data-track={track}
        aria-label={ariaLabel}
        {...(external ? { target: EXTERNAL_LINK_TARGET, rel: EXTERNAL_LINK_REL } : {})}
        className={`${CARD} ${COMMUNITY_FOCUS}`}
      >
        <span
          aria-hidden="true"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-eg-primary-soft text-eg-primary-text"
        >
          <IconComponent className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block">{label}</span>
          <span className="block truncate text-[13.5px] font-medium text-eg-muted">{value}</span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-eg-muted" aria-hidden="true" />
      </a>
    </li>
  );
}

type ChurchProfileContactProps = {
  churchName: string;
  contact: CommunityContact;
  links: Array<{ key: NetworkKey; url: string }>;
};

/** Contato: WhatsApp, telefone, e-mail e redes que existirem. Sem nenhum, não renderiza. */
export function ChurchProfileContact({ churchName, contact, links }: ChurchProfileContactProps) {
  const t = useTranslations("communityPage.contact");
  const tNetworks = useTranslations("publicChurchProfile.networks");

  if (!contact.whatsapp && !contact.phone && !contact.email && links.length === 0) return null;

  return (
    <CommunitySection id="contato" title={t("title")}>
      <ul className="grid gap-3 sm:grid-cols-2">
        {contact.whatsapp ? (
          <ChannelCard
            icon={MessageSquare}
            label={t("whatsapp")}
            value={contact.whatsapp.display}
            href={contact.whatsapp.href}
            external
            track="whatsapp"
            ariaLabel={t("openExternalAria", { channel: t("whatsapp"), name: churchName })}
          />
        ) : null}
        {links.map(({ key, url }) => {
          const network = tNetworks(key);
          return (
            <ChannelCard
              key={key}
              icon={NETWORK_ICONS[key]}
              label={network}
              value={networkDisplay(key, url)}
              href={url}
              external
              track={key}
              ariaLabel={tNetworks("openAria", { network, name: churchName })}
            />
          );
        })}
        {contact.phone ? (
          <ChannelCard
            icon={Phone}
            label={t("phone")}
            value={contact.phone.display}
            href={contact.phone.href}
            external={false}
            track="phone"
            ariaLabel={t("openAria", { channel: t("phone"), name: churchName })}
          />
        ) : null}
        {contact.email ? (
          <ChannelCard
            icon={Mail}
            label={t("email")}
            value={contact.email}
            href={`mailto:${contact.email}`}
            external={false}
            track="email"
            ariaLabel={t("openAria", { channel: t("email"), name: churchName })}
          />
        ) : null}
      </ul>
    </CommunitySection>
  );
}
