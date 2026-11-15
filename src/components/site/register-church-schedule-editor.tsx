"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFieldArray, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";

import {
  Field,
  REGISTER_FOCUS,
  REGISTER_INPUT_CLASS,
} from "@/components/site/register-church-field";
import type { FormValues } from "@/components/site/register-church-form-schema";
import { SCHEDULE_DAY_OPTIONS, SCHEDULE_MAX_ITEMS, SCHEDULE_TITLE_MAX } from "@/lib/church-register";

type ScheduleEditorProps = {
  control: Control<FormValues>;
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
};

type PendingFocus = { type: "row"; index: number } | { type: "add" };

/**
 * "Horários habituais": linhas repetíveis (dia, hora, tipo de encontro). Cada linha é um grupo
 * (`fieldset` + `legend`) com rótulos próprios. "Adicionar" leva o foco ao "Dia" da linha nova;
 * "Remover" leva o foco ao "Dia" da linha que ocupou o lugar (ou da anterior, se era a última) e,
 * sem linhas, ao botão "Adicionar horário". Um aviso em `aria-live` anuncia as duas ações.
 */
export function ScheduleEditor({ control, register, errors }: ScheduleEditorProps) {
  const t = useTranslations("register");
  const tDays = useTranslations("finder.card.days");
  const headingId = useId();
  const hintId = useId();
  const { fields, append, remove } = useFieldArray({ control, name: "schedule" });
  const listRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<PendingFocus | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const fieldError = (message?: string) => (message ? t(message) : undefined);
  const rootError = errors.schedule?.root?.message;
  const isFull = fields.length >= SCHEDULE_MAX_ITEMS;

  useEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    if (target.type === "add") {
      addRef.current?.focus();
      return;
    }
    listRef.current?.querySelector<HTMLElement>(`[data-schedule-row="${target.index}"] select`)?.focus();
  }, [fields.length]);

  function handleAdd() {
    if (isFull) return;
    pendingFocus.current = { type: "row", index: fields.length };
    append({ day: "SUNDAY", time: "", title: "" }, { shouldFocus: false });
    setAnnouncement(t("schedule.added", { count: fields.length + 1 }));
  }

  function handleRemove(index: number) {
    const remaining = fields.length - 1;
    pendingFocus.current =
      remaining === 0 ? { type: "add" } : { type: "row", index: Math.min(index, remaining - 1) };
    remove(index);
    setAnnouncement(t("schedule.removed", { count: remaining }));
  }

  return (
    <div role="group" aria-labelledby={headingId} aria-describedby={hintId} className="space-y-3">
      <div>
        <p id={headingId} className="text-xs font-bold uppercase tracking-[0.12em] text-eg-muted">
          {t("schedule.title")}
          <span className="ml-1.5 font-normal normal-case tracking-normal">({t("optional")})</span>
        </p>
        <p id={hintId} className="mt-1 text-xs leading-5 text-eg-muted">
          {t("schedule.hint")}
        </p>
      </div>

      {fields.length > 0 ? (
        <div ref={listRef} className="grid gap-4 sm:gap-3">
          {fields.map((field, index) => {
            const rowErrors = errors.schedule?.[index];
            return (
              <fieldset
                key={field.id}
                data-schedule-row={index}
                className="m-0 grid min-w-0 grid-cols-2 gap-x-3 gap-y-3 border-0 p-0 max-sm:border-t max-sm:border-eg-border max-sm:pt-4 max-sm:first:border-t-0 max-sm:first:pt-0 sm:grid-cols-[8rem_7rem_minmax(0,1fr)_auto]"
              >
                <legend className="sr-only">{t("schedule.rowLabel", { number: index + 1 })}</legend>
                <Field label={t("schedule.day")} error={fieldError(rowErrors?.day?.message)}>
                  <select
                    {...register(`schedule.${index}.day`)}
                    aria-required="true"
                    aria-invalid={rowErrors?.day ? true : undefined}
                    className={REGISTER_INPUT_CLASS}
                  >
                    {SCHEDULE_DAY_OPTIONS.map((day) => (
                      <option key={day} value={day}>
                        {tDays(day)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t("schedule.time")} error={fieldError(rowErrors?.time?.message)}>
                  <input
                    {...register(`schedule.${index}.time`)}
                    type="time"
                    aria-required="true"
                    aria-invalid={rowErrors?.time ? true : undefined}
                    className={REGISTER_INPUT_CLASS}
                  />
                </Field>
                <Field
                  label={t("schedule.kind")}
                  error={fieldError(rowErrors?.title?.message)}
                  className="col-span-2 sm:col-span-1"
                >
                  <input
                    {...register(`schedule.${index}.title`)}
                    maxLength={SCHEDULE_TITLE_MAX}
                    placeholder={t("schedule.kindPlaceholder")}
                    aria-required="true"
                    aria-invalid={rowErrors?.title ? true : undefined}
                    className={REGISTER_INPUT_CLASS}
                  />
                </Field>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  aria-label={t("schedule.remove", { number: index + 1 })}
                  className={`col-span-2 inline-flex h-11 min-w-11 items-center justify-center gap-1.5 justify-self-end rounded-[9px] px-3 text-eg-muted transition-colors hover:bg-eg-hover hover:text-eg-strong sm:col-span-1 sm:self-start sm:justify-self-auto md:h-10 md:min-w-10 sm:mt-[1.6875rem] ${REGISTER_FOCUS}`}
                >
                  <Minus className="h-4 w-4" aria-hidden="true" />
                  <span className="text-sm font-semibold sm:sr-only">{t("schedule.removeShort")}</span>
                </button>
              </fieldset>
            );
          })}
        </div>
      ) : null}

      {rootError ? (
        <p role="alert" className="text-xs font-medium text-eg-danger-text">
          {t(rootError)}
        </p>
      ) : null}

      <button
        ref={addRef}
        type="button"
        onClick={handleAdd}
        disabled={isFull}
        className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-eg-strong disabled:cursor-not-allowed disabled:opacity-60 ${REGISTER_FOCUS}`}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        <span className="text-[15px] font-medium underline underline-offset-4">{t("schedule.add")}</span>
      </button>
      {isFull ? <p className="text-xs text-eg-muted">{t("schedule.full", { max: SCHEDULE_MAX_ITEMS })}</p> : null}

      <p className="sr-only" aria-live="polite" role="status">
        {announcement}
      </p>
    </div>
  );
}
