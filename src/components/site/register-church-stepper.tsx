import { useTranslations } from "next-intl";

import type { RegistrationFormStep } from "@/components/site/register-church-form-schema";

type RegisterChurchStepperProps = {
  steps: RegistrationFormStep[];
  currentStep: number;
  onSelectStep: (index: number) => void;
};

export function RegisterChurchStepper({
  steps,
  currentStep,
  onSelectStep,
}: RegisterChurchStepperProps) {
  const t = useTranslations("register.stepper");
  const tSteps = useTranslations("register");
  const activeStep = steps[currentStep];
  const progressValue = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="mb-8 rounded-[1.75rem] border border-eg-border bg-eg-subtle p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-eg-primary-text">
            {t("stepOf", { current: currentStep + 1, total: steps.length })}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-eg-strong">{tSteps(activeStep.title)}</h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-eg-muted">{tSteps(activeStep.description)}</p>
        </div>
        <span className="w-fit rounded-full border border-eg-border bg-eg-primary-soft px-3 py-1 text-xs font-semibold text-eg-primary-text">
          {t("percent", { percent: Math.round(progressValue) })}
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-eg-border" aria-hidden="true">
        <div
          className="h-full rounded-full bg-eg-primary transition-all duration-300"
          style={{ width: `${progressValue}%` }}
        />
      </div>

      <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label={t("ariaSteps")}>
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isComplete = index < currentStep;
          const isDisabled = index > currentStep;

          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => onSelectStep(index)}
                disabled={isDisabled}
                aria-current={isActive ? "step" : undefined}
                className={[
                  "flex min-h-16 w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left transition",
                  isActive
                    ? "border-eg-primary bg-eg-primary-soft text-eg-strong"
                    : "border-eg-border bg-eg-subtle text-eg-text",
                  isComplete ? "hover:bg-eg-hover" : "",
                  isDisabled ? "cursor-not-allowed opacity-45" : "",
                ].join(" ")}
              >
                <span
                  className={[
                    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    isActive || isComplete ? "bg-eg-primary text-eg-inverse" : "bg-eg-border text-eg-muted",
                  ].join(" ")}
                >
                  {index + 1}
                </span>
                <span>
                  <span className="block text-sm font-semibold">{tSteps(step.label)}</span>
                  <span className="block text-xs text-eg-muted">
                    {isComplete ? t("review") : isActive ? t("inProgress") : t("locked")}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
