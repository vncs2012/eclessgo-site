"use client";

import { Mail, Phone } from "lucide-react";

import { PixKeyDonationCard } from "@/components/site/pix-key-donation-card";
import { trackPublicEvent } from "@/lib/public-analytics";

type ChurchContactCardProps = {
  churchId: string;
  churchName: string;
  slug: string;
  email: string | null;
  phone: string | null;
  pixKey: string | null;
  donationsEnabled: boolean;
};

function toPhoneHref(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "");
  return `tel:${digits}`;
}

export function ChurchContactCard({
  churchId,
  churchName,
  slug,
  email,
  phone,
  pixKey,
  donationsEnabled,
}: ChurchContactCardProps) {
  const path = `/comunidades/${slug}`;

  return (
    <div className="glass-card rounded-[1.9rem] p-6">
      <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Contato publico</p>
      <div className="mt-4 space-y-3 text-sm text-zinc-300">
        {email ? (
          <a
            href={`mailto:${email}`}
            onClick={() =>
              void trackPublicEvent({
                churchId,
                eventType: "PUBLIC_CHURCH_CONTACT_CLICK",
                source: "WEB_DETAIL",
                path,
                metadata: {
                  channel: "email",
                },
              })
            }
            className="flex items-center gap-3 transition hover:text-white"
          >
            <Mail className="h-4 w-4 text-emerald-300" />
            {email}
          </a>
        ) : null}
        {phone ? (
          <a
            href={toPhoneHref(phone)}
            onClick={() =>
              void trackPublicEvent({
                churchId,
                eventType: "PUBLIC_CHURCH_CONTACT_CLICK",
                source: "WEB_DETAIL",
                path,
                metadata: {
                  channel: "phone",
                },
              })
            }
            className="flex items-center gap-3 transition hover:text-white"
          >
            <Phone className="h-4 w-4 text-emerald-300" />
            {phone}
          </a>
        ) : null}
        {donationsEnabled && pixKey ? (
          <PixKeyDonationCard
            churchId={churchId}
            churchName={churchName}
            slug={slug}
            pixKey={pixKey}
          />
        ) : donationsEnabled ? (
          <p className="rounded-[1rem] border border-amber-300/15 bg-amber-400/[0.06] px-4 py-3 text-xs leading-6 text-amber-100">
            Doações estão habilitadas, mas a chave PIX da comunidade ainda não foi configurada.
          </p>
        ) : pixKey ? (
          <p className="rounded-[1rem] border border-white/8 bg-zinc-950/70 px-4 py-3 text-xs leading-6 text-zinc-400">
            Doações não estão habilitadas para esta comunidade no momento.
          </p>
        ) : null}
        {!email && !phone && !donationsEnabled && !pixKey ? (
          <p className="text-sm leading-7 text-zinc-400">
            Esta comunidade ainda nao publicou canais publicos de contato.
          </p>
        ) : null}
      </div>
    </div>
  );
}
