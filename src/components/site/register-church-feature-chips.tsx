"use client";

import { useId } from "react";
import { Check, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { FEATURE_CODES } from "@/lib/church-features";

type FeatureChipsProps = {
  value: readonly string[];
  onChange: (next: string[]) => void;
};

/**
 * "Para a visita": cada instalação é um checkbox nativo (transparente, cobrindo o chip) com aparência de
 * chip. O foco do teclado aparece no chip (`peer-focus-visible`), o estado marcado também no ícone.
 */
export function FeatureChips({ value, onChange }: FeatureChipsProps) {
  const t = useTranslations("register");
  const tCodes = useTranslations("features.codes");
  const headingId = useId();
  const hintId = useId();

  function toggle(code: string, checked: boolean) {
    const next = new Set(value);
    if (checked) next.add(code);
    else next.delete(code);
    onChange(FEATURE_CODES.filter((item) => next.has(item)));
  }

  return (
    <div role="group" aria-labelledby={headingId} aria-describedby={hintId} className="space-y-2">
      <div>
        <p id={headingId} className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-eg-muted">
          {t("features.title")}
          <span className="rounded-full bg-eg-primary-soft px-2 py-0.5 text-[11px] font-bold tracking-wide text-eg-primary-text">
            {t("features.new")}
          </span>
        </p>
        <p id={hintId} className="mt-1 text-xs leading-5 text-eg-muted">
          {t("features.hint")}
        </p>
      </div>
      <ul className="flex flex-wrap gap-2">
        {FEATURE_CODES.map((code) => {
          const checked = value.includes(code);
          return (
            <li key={code}>
              <label className="relative inline-flex cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => toggle(code, event.target.checked)}
                  className="peer absolute inset-0 m-0 h-full w-full cursor-pointer opacity-0"
                />
                <span
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-eg-border-strong bg-eg-surface px-4 text-eg-strong transition-colors hover:bg-eg-hover peer-checked:border-eg-primary peer-checked:bg-eg-primary-soft peer-checked:text-eg-primary-text peer-focus-visible:outline-2 peer-focus-visible:outline-solid peer-focus-visible:outline-offset-2 peer-focus-visible:outline-eg-focus md:h-10"
                >
                  {checked ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span className="text-sm font-semibold">{tCodes(code)}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
