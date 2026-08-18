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
    <div className="mb-8 rounded-[1.75rem] border border-white/10 bg-zinc-950/55 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            {t("stepOf", { current: currentStep + 1, total: steps.length })}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-50">{tSteps(activeStep.title)}</h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-400">{tSteps(activeStep.description)}</p>
        </div>
        <span className="w-fit rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
          {t("percent", { percent: Math.round(progressValue) })}
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8" aria-hidden="true">
        <div
          className="h-full rounded-full bg-emerald-400 transition-all duration-300"
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
                    ? "border-emerald-300/60 bg-emerald-400/12 text-white"
                    : "border-white/10 bg-zinc-950/40 text-zinc-300",
                  isComplete ? "hover:border-emerald-400/35 hover:bg-emerald-400/8" : "",
                  isDisabled ? "cursor-not-allowed opacity-45" : "",
                ].join(" ")}
              >
                <span
                  className={[
                    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    isActive || isComplete ? "bg-emerald-400 text-emerald-950" : "bg-white/8 text-zinc-400",
                  ].join(" ")}
                >
                  {index + 1}
                </span>
                <span>
                  <span className="block text-sm font-semibold">{tSteps(step.label)}</span>
                  <span className="block text-xs text-zinc-500">
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
