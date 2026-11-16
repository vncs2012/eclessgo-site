"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { fetchWithClientTrace } from "@/lib/client-fetch";
import {
  CORRECTION_CATEGORIES,
  CORRECTION_CONTACT_MAX,
  CORRECTION_MESSAGE_MAX,
  CORRECTION_MESSAGE_MIN,
  churchCorrectionSchema,
  correctionFieldErrors,
  type CorrectionCategory,
  type CorrectionFieldErrors,
} from "@/lib/church-correction";
import { cn } from "@/lib/utils";

type SuggestCorrectionProps = {
  slug: string;
  /** Texto do botão que abre o diálogo ("Sugerir correção"). */
  label: string;
  /** Aparência do botão (cada lugar da página tem a sua). */
  className?: string;
  /** Tipografia do texto do botão: vai no `span`, porque `button { font: inherit }` anula `text-*` no botão. */
  labelClassName?: string;
};

type Status = "idle" | "sending" | "done" | "invalid" | "rateLimited" | "error";

const FIELD =
  "input-surface w-full rounded-[9px] px-3.5 text-[15px] md:text-sm";
/** Foco visível: contorno sólido de 2 px (as variantes que escondem o contorno anulam o foco no Tailwind 4). */
const COMMUNITY_FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-eg-focus";
const BUTTON =
  "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full px-5 transition-colors aria-disabled:cursor-not-allowed aria-disabled:opacity-60";

/**
 * "Sugerir correção": botão que abre um `<dialog>` nativo (`showModal`): o navegador prende o foco,
 * deixa o resto da página inerte, fecha no Esc e devolve o foco ao botão. O formulário só existe
 * enquanto o diálogo está aberto, então fechar descarta o que foi digitado (nada fica guardado).
 */
export function SuggestCorrection({ slug, label, className, labelClassName }: SuggestCorrectionProps) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  function openDialog() {
    setOpen(true);
    dialog.current?.showModal();
  }

  function handleClose() {
    setOpen(false);
    trigger.current?.focus();
  }

  return (
    <>
      <button
        ref={trigger}
        type="button"
        onClick={openDialog}
        aria-haspopup="dialog"
        className={cn("cursor-pointer", COMMUNITY_FOCUS, className)}
      >
        <span className={labelClassName}>{label}</span>
      </button>

      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        onClose={handleClose}
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current?.close();
        }}
        className="m-auto max-h-[calc(100dvh-1.5rem)] w-[min(32rem,calc(100vw-1.5rem))] overflow-y-auto overscroll-contain rounded-2xl border border-eg-border bg-eg-surface p-0 text-eg-text shadow-[var(--eg-shadow-md)] backdrop:bg-[var(--eg-scrim)]"
      >
        {open ? (
          <SuggestForm
            slug={slug}
            titleId={titleId}
            onClose={() => dialog.current?.close()}
          />
        ) : null}
      </dialog>
    </>
  );
}

function describedBy(...ids: Array<string | false | undefined>) {
  return ids.filter(Boolean).join(" ");
}

function SuggestForm({ slug, titleId, onClose }: { slug: string; titleId: string; onClose: () => void }) {
  const t = useTranslations("communityPage.suggest");
  const baseId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const doneClose = useRef<HTMLButtonElement>(null);
  const [category, setCategory] = useState<CorrectionCategory | "">("");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [homepage, setHomepage] = useState("");
  const [errors, setErrors] = useState<CorrectionFieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");

  // Sem rolagem da página por trás enquanto o diálogo está aberto; o foco inicial vai ao 1.º campo.
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    formRef.current?.querySelector<HTMLElement>("input[type=radio]")?.focus();
    return () => {
      root.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    if (status === "done") doneClose.current?.focus();
  }, [status]);

  const ids = {
    category: `${baseId}-category`,
    categoryError: `${baseId}-category-error`,
    message: `${baseId}-message`,
    messageHint: `${baseId}-message-hint`,
    messageCount: `${baseId}-message-count`,
    messageError: `${baseId}-message-error`,
    contact: `${baseId}-contact`,
    contactHint: `${baseId}-contact-hint`,
    contactError: `${baseId}-contact-error`,
  };
  const fieldError = (key?: string) => (key ? t(`validation.${key}` as "validation.messageMin", {
    min: CORRECTION_MESSAGE_MIN,
    max: CORRECTION_MESSAGE_MAX,
    contactMax: CORRECTION_CONTACT_MAX,
  }) : undefined);

  function focusFirstInvalid(fields: CorrectionFieldErrors) {
    const target = fields.category
      ? formRef.current?.querySelector<HTMLElement>("input[type=radio]")
      : fields.message
        ? document.getElementById(ids.message)
        : fields.contact
          ? document.getElementById(ids.contact)
          : null;
    target?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const parsed = churchCorrectionSchema.safeParse({
      category: category || undefined,
      message,
      contact,
      homepage,
    });
    if (!parsed.success) {
      const fields = correctionFieldErrors(parsed.error);
      setErrors(fields);
      setStatus("invalid");
      focusFirstInvalid(fields);
      return;
    }

    setErrors({});
    setStatus("sending");
    try {
      const response = await fetchWithClientTrace(
        `/api/public/churches/slug/${encodeURIComponent(slug)}/corrections`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(parsed.data),
        },
      );
      if (response.ok) {
        // O texto e o contato não ficam guardados: só o agradecimento permanece na tela.
        setMessage("");
        setContact("");
        setStatus("done");
        return;
      }
      if (response.status === 429) {
        setStatus("rateLimited");
        return;
      }
      if (response.status === 422) {
        const body = (await response.json().catch(() => null)) as { fields?: CorrectionFieldErrors } | null;
        const fields = body?.fields ?? {};
        setErrors(fields);
        setStatus("invalid");
        focusFirstInvalid(fields);
        return;
      }
      setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  const sending = status === "sending";
  const count = message.length;

  return (
    <div className="p-5 sm:p-6">
      <div className="mb-1 flex items-start justify-between gap-3">
        <h2 id={titleId} className="font-display text-xl font-extrabold tracking-[-0.02em] text-eg-strong">
          {t("title")}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className={cn(
            "-mr-2 -mt-1.5 inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-eg-strong hover:bg-eg-hover",
            COMMUNITY_FOCUS,
          )}
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {status === "done" ? (
        <div role="status" className="grid gap-4 pt-2">
          <p className="flex items-start gap-2.5 text-[15px] leading-6 text-eg-text">
            <Check
              className="mt-1 h-[18px] w-[18px] shrink-0 text-[var(--eg-feedback-success-text)]"
              aria-hidden="true"
            />
            <span>
              <strong className="block text-eg-strong">{t("thanksTitle")}</strong>
              {t("thanksBody")}
            </span>
          </p>
          <button
            ref={doneClose}
            type="button"
            onClick={onClose}
            className={cn(
              BUTTON,
              "justify-self-start bg-eg-primary text-eg-inverse hover:bg-eg-primary-hover",
              COMMUNITY_FOCUS,
            )}
          >
            <span className="text-[14.5px] font-bold">{t("close")}</span>
          </button>
        </div>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit} noValidate className="grid gap-5 pt-1">
          <p className="text-sm leading-6 text-eg-muted">{t("description")}</p>

          <fieldset
            role="radiogroup"
            aria-required="true"
            className="m-0 min-w-0 border-0 p-0"
            aria-describedby={errors.category ? ids.categoryError : undefined}
          >
            <legend className="mb-2 text-[13px] font-bold text-eg-strong">{t("categoryLegend")}</legend>
            <div className="flex flex-wrap gap-2">
              {CORRECTION_CATEGORIES.map((value) => (
                <label key={value} className="relative inline-flex cursor-pointer">
                  <input
                    type="radio"
                    name={ids.category}
                    value={value}
                    checked={category === value}
                    onChange={() => setCategory(value)}
                    className="peer absolute inset-0 m-0 h-full w-full cursor-pointer opacity-0"
                  />
                  <span className="inline-flex h-11 items-center gap-1.5 rounded-full border border-eg-border-strong bg-eg-surface px-4 text-eg-strong transition-colors hover:bg-eg-hover peer-checked:border-eg-primary peer-checked:bg-eg-primary-soft peer-checked:text-eg-primary-text peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-solid peer-focus-visible:outline-eg-focus">
                    <span className="text-sm font-semibold">{t(`categories.${value}`)}</span>
                    {category === value ? <Check className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
                  </span>
                </label>
              ))}
            </div>
            {errors.category ? (
              <p id={ids.categoryError} role="alert" className="mt-1.5 text-xs font-medium leading-5 text-eg-danger-text">
                {fieldError(errors.category)}
              </p>
            ) : null}
          </fieldset>

          <div>
            <label htmlFor={ids.message} className="mb-1.5 block text-[13px] font-bold text-eg-strong">
              {t("messageLabel")}
            </label>
            <textarea
              id={ids.message}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={5}
              aria-required="true"
              aria-invalid={errors.message ? true : undefined}
              aria-describedby={describedBy(ids.messageHint, ids.messageCount, errors.message && ids.messageError)}
              className={cn(FIELD, "min-h-28 resize-y py-2.5")}
            />
            <div className="mt-1.5 flex items-start justify-between gap-3 text-xs leading-5 text-eg-muted">
              <p id={ids.messageHint}>{t("messageHint", { min: CORRECTION_MESSAGE_MIN })}</p>
              <p
                id={ids.messageCount}
                className={cn("shrink-0 tabular-nums", count > CORRECTION_MESSAGE_MAX && "font-bold text-eg-danger-text")}
              >
                {t("counter", { count, max: CORRECTION_MESSAGE_MAX })}
              </p>
            </div>
            {errors.message ? (
              <p id={ids.messageError} role="alert" className="mt-1 text-xs font-medium leading-5 text-eg-danger-text">
                {fieldError(errors.message)}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor={ids.contact} className="mb-1.5 block text-[13px] font-bold text-eg-strong">
              {t("contactLabel")}
              <span className="ml-1.5 text-xs font-normal text-eg-muted">({t("optional")})</span>
            </label>
            <input
              id={ids.contact}
              type="text"
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              autoComplete="off"
              aria-invalid={errors.contact ? true : undefined}
              aria-describedby={describedBy(ids.contactHint, errors.contact && ids.contactError)}
              className={cn(FIELD, "h-11")}
            />
            <p id={ids.contactHint} className="mt-1.5 text-xs leading-5 text-eg-muted">
              {t("contactHint")}
            </p>
            {errors.contact ? (
              <p id={ids.contactError} role="alert" className="mt-1 text-xs font-medium leading-5 text-eg-danger-text">
                {fieldError(errors.contact)}
              </p>
            ) : null}
          </div>

          {/* Isca para robôs: fora da tela, fora do Tab e escondida dos leitores de tela. Gente não preenche. */}
          <div aria-hidden="true" className="pointer-events-none absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
            <input
              type="text"
              name="homepage"
              value={homepage}
              onChange={(event) => setHomepage(event.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {status === "invalid" && !errors.category && !errors.message && !errors.contact ? (
            <p role="alert" className="text-sm font-medium text-eg-danger-text">
              {t("invalid")}
            </p>
          ) : null}
          {status === "rateLimited" ? (
            <p role="alert" className="text-sm font-medium text-eg-danger-text">
              {t("rateLimited")}
            </p>
          ) : null}
          {status === "error" ? (
            <p role="alert" className="text-sm font-medium text-eg-danger-text">
              {t("error")}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              aria-disabled={sending ? true : undefined}
              className={cn(BUTTON, "bg-eg-primary text-eg-inverse hover:bg-eg-primary-hover", COMMUNITY_FOCUS)}
            >
              <span className="text-[14.5px] font-bold">{sending ? t("sending") : t("submit")}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className={cn(
                BUTTON,
                "border-[1.5px] border-eg-border-strong text-eg-strong hover:bg-eg-hover",
                COMMUNITY_FOCUS,
              )}
            >
              <span className="text-[14.5px] font-bold">{t("cancel")}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
