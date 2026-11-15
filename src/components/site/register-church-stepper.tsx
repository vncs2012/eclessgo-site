import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import type { RegistrationFormStep } from "@/components/site/register-church-form-schema";
import { cn } from "@/lib/utils";

type RegisterChurchStepperProps = {
  steps: RegistrationFormStep[];
  currentStep: number;
  onSelectStep: (index: number) => void;
  className?: string;
};

/**
 * Etapas do cadastro (Modelo 8). A partir de xl é a coluna da esquerda (rótulo + linha de apoio);
 * abaixo disso vira uma faixa horizontal só com rótulos (md) ou só com os números (celular, onde
 * o nome da etapa atual aparece acima). Sem texto que encoste no passo seguinte: o rótulo quebra
 * dentro do próprio botão (`min-w-0`) em vez de transbordar.
 */
export function RegisterChurchStepper({
  steps,
  currentStep,
  onSelectStep,
  className,
}: RegisterChurchStepperProps) {
  const t = useTranslations("register.stepper");
  const tSteps = useTranslations("register");
  const progressValue = ((currentStep + 1) / steps.length) * 100;

  return (
    <nav
      aria-label={t("ariaSteps")}
      className={cn("rounded-xl border border-eg-border bg-eg-surface p-4 shadow-[var(--eg-shadow-sm)] xl:p-5", className)}
    >
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-eg-primary-text">
        {t("stepOf", { current: currentStep + 1, total: steps.length })}
        <span className="md:hidden"> · {tSteps(steps[currentStep].label)}</span>
      </p>

      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-eg-border" aria-hidden="true">
        <div
          className="h-full rounded-full bg-eg-primary transition-[width] duration-300"
          style={{ width: `${progressValue}%` }}
        />
      </div>

      <ol className="mt-4 flex justify-between gap-1 xl:flex-col xl:justify-start">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isComplete = index < currentStep;
          const isDisabled = index > currentStep;

          return (
            <li key={step.id} className="min-w-0">
              <button
                type="button"
                onClick={() => onSelectStep(index)}
                disabled={isDisabled}
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2 py-2 xl:gap-3 text-left transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-eg-focus",
                  isActive ? "bg-eg-primary-soft" : "",
                  isComplete ? "hover:bg-eg-hover" : "",
                  isDisabled ? "cursor-not-allowed" : "",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                    isComplete && "border-transparent bg-eg-success text-eg-inverse",
                    isActive && "border-transparent bg-eg-primary text-eg-inverse",
                    isDisabled && "border-eg-border-strong text-eg-muted",
                  )}
                >
                  {isComplete ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-bold">{index + 1}</span>
                  )}
                </span>
                <span className="min-w-0 max-md:sr-only">
                  <span className="block text-sm font-bold leading-5 text-eg-strong">{tSteps(step.label)}</span>
                  <span className="block text-xs leading-5 text-eg-muted max-xl:sr-only">
                    {isComplete ? t("completed") : tSteps(step.summary)}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
