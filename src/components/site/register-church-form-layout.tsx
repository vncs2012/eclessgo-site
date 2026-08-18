import Link from "next/link";
import { ArrowRight, Church, MapPinned } from "lucide-react";
import { useTranslations } from "next-intl";

type RegisterChurchFooterProps = {
  currentStep: number;
  isLastStep: boolean;
  isSubmitting: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

export function RegisterChurchIntro() {
  const t = useTranslations("register.intro");
  return (
    <div className="mb-8 flex items-start gap-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/20">
        <Church className="h-6 w-6" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{t("eyebrow")}</p>
        <h2 className="section-title mt-2 text-3xl font-semibold text-zinc-50">{t("title")}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
          {t("description")}
        </p>
      </div>
    </div>
  );
}

export function RegisterChurchFooter({
  currentStep,
  isLastStep,
  isSubmitting,
  onPrevious,
  onNext,
}: RegisterChurchFooterProps) {
  const t = useTranslations("register.footer");
  return (
    <div className="mt-8 flex flex-col gap-4 border-t border-white/8 pt-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3 text-sm text-zinc-400">
        <MapPinned className="mt-0.5 h-4 w-4 text-emerald-300" />
        <p>
          {t("note")}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/comunidades"
          className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-emerald-400/30 hover:text-white"
        >
          {t("publicMap")}
        </Link>
        {currentStep > 0 ? (
          <button
            type="button"
            onClick={onPrevious}
            className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-emerald-400/30 hover:text-white"
          >
            {t("back")}
          </button>
        ) : null}
        {isLastStep ? (
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? t("submitting") : t("submit")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            className="inline-flex rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
          >
            {t("continue")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
