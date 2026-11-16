import { Info } from "lucide-react";
import { useTranslations } from "next-intl";

import { COMMUNITY_FOCUS, CommunitySection } from "@/components/site/community-section";
import { EXTERNAL_LINK_REL, EXTERNAL_LINK_TARGET } from "@/lib/public-church-profile";
import {
  durationMessage,
  groupScheduleRows,
  initials,
  photoGradientIndex,
  WEEK_ORDER,
  type ScheduleRow,
} from "@/lib/public-community-page";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ Sobre */

export function CommunityAbout({ description }: { description: string | null }) {
  const t = useTranslations("communityPage.about");
  const paragraphs = (description ?? "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return null;

  return (
    <CommunitySection id="sobre" title={t("title")}>
      <div className="grid max-w-[68ch] gap-3 text-[15px] leading-[1.65] text-eg-text md:text-[17px]">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="whitespace-pre-line">
            {paragraph}
          </p>
        ))}
      </div>
    </CommunitySection>
  );
}

/* ---------------------------------------------------------------- Horários */

type ScheduleNoteProps = {
  /** dd/mm/aaaa quando a API informa a atualização. */
  date: string | null;
  /** Link do WhatsApp da comunidade; sem ele o aviso não tem link. */
  whatsappHref: string | null;
  /** Texto curto do celular. */
  short?: boolean;
  className?: string;
};

/** Aviso "confirme antes de ir": os horários são de rotina e podem mudar. */
export function CommunityScheduleNote({ date, whatsappHref, short = false, className }: ScheduleNoteProps) {
  const t = useTranslations("communityPage.schedule");
  const values = { dated: date ? "yes" : "no", date: date ?? "" };
  const key = `${short ? "noteShort" : "note"}${whatsappHref ? "Whatsapp" : "Plain"}` as
    | "noteWhatsapp"
    | "notePlain"
    | "noteShortWhatsapp"
    | "noteShortPlain";

  return (
    <p
      className={cn(
        "flex items-start gap-3 rounded-2xl bg-eg-warm-soft px-3.5 py-3 text-sm text-eg-strong md:px-4 md:py-3.5 md:text-[15px]",
        className,
      )}
    >
      <Info className="mt-0.5 h-[18px] w-[18px] shrink-0 text-eg-warm" aria-hidden="true" />
      <span>
        {t.rich(key, {
          ...values,
          link: (chunks) => (
            <a
              href={whatsappHref ?? "#"}
              data-track="whatsapp"
              target={EXTERNAL_LINK_TARGET}
              rel={EXTERNAL_LINK_REL}
              className={cn("rounded-sm font-bold underline underline-offset-2", COMMUNITY_FOCUS)}
            >
              {chunks}
            </a>
          ),
        })}
      </span>
    </p>
  );
}

export function CommunitySchedule({
  rows,
  date,
  whatsappHref,
}: {
  rows: ScheduleRow[];
  date: string | null;
  whatsappHref: string | null;
}) {
  const t = useTranslations("communityPage.schedule");
  const tDays = useTranslations("finder.card.days");

  const groups = groupScheduleRows(rows);

  if (groups.length === 0) return null;

  return (
    <CommunitySection id="horarios" title={t("title")}>
      <ul className="overflow-hidden rounded-[18px] border border-eg-border bg-eg-surface">
        {groups.map((row) => {
          const isWeekday = row.day !== null && (WEEK_ORDER as readonly string[]).includes(row.day);
          const dayLabel = row.day ? (isWeekday ? tDays(row.day as (typeof WEEK_ORDER)[number]) : row.day) : null;
          const heading = [row.title, row.times.join(t("join"))].filter(Boolean).join(" · ");
          const duration = durationMessage(row.durationMinutes);
          // "Cerca de 1h30 · espaço infantil": a duração vem antes da descrição, na mesma linha.
          const detail = [
            duration ? t(duration.key, duration.values as never) : null,
            row.description,
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <li
              key={row.id}
              className="grid gap-1 border-t border-eg-border px-4 py-4 first:border-t-0 md:grid-cols-[200px_minmax(0,1fr)] md:items-center md:gap-5 md:px-5"
            >
              {dayLabel ? (
                <p className="font-display text-[17px] font-extrabold tracking-[-0.01em] text-eg-strong">
                  {dayLabel}
                  {isWeekday ? (
                    <span className="block font-sans text-[13.5px] font-medium tracking-normal text-eg-muted">
                      {t("everyWeek")}
                    </span>
                  ) : null}
                </p>
              ) : (
                <span aria-hidden="true" className="max-md:hidden" />
              )}
              <div>
                <p className="text-base font-bold text-eg-strong">{heading}</p>
                {detail ? <p className="text-sm text-eg-muted">{detail}</p> : null}
              </div>
            </li>
          );
        })}
      </ul>
      <CommunityScheduleNote
        date={date}
        whatsappHref={whatsappHref}
        className="mt-3.5 max-md:hidden"
      />
    </CommunitySection>
  );
}

/* -------------------------------------------------------------- Quem é quem */

export type CommunityPerson = { name: string; role: string | null };

/** Quem é quem (`public_team` da API): iniciais em avatar, nome e função. Sem itens, não renderiza. */
export function CommunityPeople({ people }: { people: CommunityPerson[] }) {
  const t = useTranslations("communityPage.people");

  if (people.length === 0) return null;

  return (
    <CommunitySection id="quem-e-quem" title={t("title")}>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {people.map((person, index) => (
          <li
            key={`${index}-${person.name}`}
            className="flex items-center gap-3.5 rounded-2xl border border-eg-border bg-eg-surface p-4"
          >
            <span
              aria-hidden="true"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-eg-on-photo"
              style={{ background: `var(--eg-photo-${photoGradientIndex(person.name)})` }}
            >
              {initials(person.name)}
            </span>
            <div className="min-w-0">
              <p className="font-bold text-eg-strong">{person.name}</p>
              {person.role ? <p className="text-sm text-eg-muted">{person.role}</p> : null}
            </div>
          </li>
        ))}
      </ul>
    </CommunitySection>
  );
}
