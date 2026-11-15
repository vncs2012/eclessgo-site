import { ArrowRight, ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";

import { REGISTER_FOCUS } from "@/components/site/register-church-field";
import type { RegistrationFormStep } from "@/components/site/register-church-form-schema";

type RegisterChurchFooterProps = {
  currentStep: number;
  isLastStep: boolean;
  isSubmitting: boolean;
  isSubmitDisabled?: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

/** Chamada da página: o h1 muda com o passo (cada passo tem sua frase). */
export function RegisterChurchHeading({ step }: { step: RegistrationFormStep }) {
  const t = useTranslations("register");
  return (
    <div className="mb-6">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-eg-warm">{t("heading.eyebrow")}</p>
      <h1 className="mt-2 max-w-4xl font-display text-[28px] font-extrabold leading-tight tracking-[-0.03em] text-eg-strong sm:text-[34px] lg:text-[38px]">
        {t(step.headline)}
      </h1>
    </div>
  );
}

/** Cabeçalho do cartão do formulário: "Etapa 2 · Comunidade", título e descrição do passo. */
export function RegisterChurchFormHeader({ step, number }: { step: RegistrationFormStep; number: number }) {
  const t = useTranslations("register");
  return (
    <div className="border-b border-eg-border px-5 pb-4 pt-5 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-eg-muted">
        {t("heading.stepLabel", { number, label: t(step.label) })}
      </p>
      <h2 className="mt-1.5 font-display text-[22px] font-extrabold tracking-[-0.02em] text-eg-strong">
        {t(step.title)}
      </h2>
      <p className="mt-1 text-sm leading-6 text-eg-muted">{t(step.description)}</p>
    </div>
  );
}

export function RegisterChurchFooter({
  currentStep,
  isLastStep,
  isSubmitting,
  isSubmitDisabled = false,
  onPrevious,
  onNext,
}: RegisterChurchFooterProps) {
  const t = useTranslations("register.footer");
  const primary = `inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-eg-primary px-5 text-eg-inverse shadow-[var(--eg-shadow-md)] transition-colors hover:bg-eg-primary-hover disabled:cursor-not-allowed disabled:opacity-70 ${REGISTER_FOCUS}`;
  return (
    <div className="flex flex-col gap-3 border-t border-eg-border bg-eg-subtle px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      {currentStep > 0 ? (
        <button
          type="button"
          onClick={onPrevious}
          className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-eg-border-strong bg-eg-surface px-4 text-eg-strong transition-colors hover:bg-eg-hover max-sm:order-2 ${REGISTER_FOCUS}`}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm font-semibold">{t("back")}</span>
        </button>
      ) : (
        <span aria-hidden="true" className="max-sm:hidden" />
      )}
      <p className="text-sm text-eg-muted max-sm:order-3 max-sm:text-center">{t("requiredNote")}</p>
      {isLastStep ? (
        <button type="submit" disabled={isSubmitting || isSubmitDisabled} className={`${primary} max-sm:order-1`}>
          <span className="text-sm font-bold">{isSubmitting ? t("submitting") : t("submit")}</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : (
        <button type="button" onClick={onNext} className={`${primary} max-sm:order-1`}>
          <span className="text-sm font-bold">{t("continue")}</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
