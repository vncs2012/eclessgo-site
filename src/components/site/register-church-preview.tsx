"use client";

import { useId, useState } from "react";
import { ChevronDown, Clock3, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { useWatch, type Control } from "react-hook-form";

import { ResultCard, type NumberedChurch } from "@/components/site/church-finder-results";
import type { FormValues } from "@/components/site/register-church-form-schema";
import { buildDenomination, previewScheduleEntries } from "@/lib/church-register";
import { summarizeSchedule } from "@/lib/public-church-utils";
import { cn } from "@/lib/utils";

type RegisterChurchPreviewProps = {
  control: Control<FormValues>;
};

/**
 * Prévia ao vivo: o mesmo cartão da Busca (ResultCard, até 2 horários agrupados por dia e as
 * pílulas) e o resumo de horários do topo da página da comunidade. Só mostra horários de rotina;
 * sem destaque de encontro em andamento nem contagem regressiva. O conteúdo é `inert`: é uma amostra, não controles.
 * No celular fica recolhida por padrão, abaixo do formulário.
 */
export function RegisterChurchPreview({ control }: RegisterChurchPreviewProps) {
  const t = useTranslations("register.preview");
  const tFinder = useTranslations("finder");
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [updatedAt] = useState(() => new Date().toISOString());
  const [name, tradition, line, neighborhood, schedule, features] = useWatch({
    control,
    name: ["churchName", "churchTradition", "churchLine", "neighborhood", "schedule", "features"],
  });

  const entries = previewScheduleEntries(schedule);
  const traditionLabels = tFinder.raw("traditions") as Record<string, string>;
  const dayLabel = (day: string) => (tFinder.has(`card.days.${day}`) ? tFinder(`card.days.${day}` as "card.days.SUNDAY") : day);
  const joinTimes = (times: string[]) => times.join(tFinder("card.scheduleJoin"));
  const topLines = summarizeSchedule(entries, dayLabel, joinTimes, 7);

  const item: NumberedChurch = {
    number: 1,
    church: {
      id: "register-preview",
      slug: "register-preview",
      name: name?.trim() || t("namePlaceholder"),
      denomination: tradition ? buildDenomination(tradition, line, traditionLabels) : "",
      addressLine: "",
      city: null,
      state: null,
      neighborhood: neighborhood?.trim() || null,
      location: { lat: 0, lng: 0 },
      description: null,
      isLive: false,
      memberCount: 0,
      plan: "",
      distanceKm: null,
      thumbnail: null,
      schedule: entries,
      features: features ?? [],
      updatedAt,
    },
  };

  return (
    <aside
      aria-label={t("aria")}
      className="rounded-xl border border-eg-border bg-eg-surface shadow-[var(--eg-shadow-sm)] lg:sticky lg:top-20 lg:self-start"
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-4 text-left text-eg-strong focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-eg-focus md:hidden"
      >
        <span className="text-xs font-bold uppercase tracking-[0.12em]">{t("toggle")}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>

      <div id={panelId} className={cn("p-4 md:p-5", !open && "max-md:hidden")}>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-eg-muted">{t("search")}</p>
        <ul className="mt-3 grid" inert>
          <ResultCard item={item} selected={false} onSelect={() => undefined} />
        </ul>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.12em] text-eg-muted">{t("pageTop")}</p>
        <div className="mt-3 flex items-start gap-3 rounded-xl border border-eg-border bg-eg-surface p-4">
          <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-eg-primary-text" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-eg-muted">{t("scheduleTitle")}</p>
            {topLines.length > 0 ? (
              <ul className="mt-1 grid gap-0.5">
                {topLines.map((text, index) => (
                  <li key={text} className={cn("text-sm", index === 0 ? "font-bold text-eg-strong" : "text-eg-muted")}>
                    {text}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-eg-muted">{t("scheduleEmpty")}</p>
            )}
          </div>
        </div>
        <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-eg-muted">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {t("note")}
        </p>
      </div>
    </aside>
  );
}
