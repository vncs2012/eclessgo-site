"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";

import { captureClientException } from "@/lib/observability-client";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const t = useTranslations("errorPage");
  useEffect(() => {
    captureClientException(error, {
      tags: { source: "next-error-boundary" },
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <div className="site-shell flex min-h-screen items-center justify-center px-4 py-16">
      <div className="grid-noise absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="border border-eg-border bg-eg-surface shadow-[var(--eg-shadow-web)] relative z-10 max-w-2xl rounded-[2rem] p-8 text-center sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-eg-warning-text/30 bg-eg-warning-soft text-eg-warning-text">
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        </div>

        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-eg-muted">
          {t("eyebrow")}
        </p>
        <h1 className="section-title mt-4 text-4xl font-semibold text-eg-strong">
          {t("title")}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-eg-muted">
          {t("description")}
        </p>

        {error.digest ? (
          <p className="mx-auto mt-5 inline-flex rounded-full border border-eg-border bg-eg-subtle px-3 py-1 text-xs text-eg-muted">
            {t("supportCode", { digest: error.digest })}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center rounded-full bg-eg-primary px-5 py-2.5 text-sm font-semibold text-eg-inverse transition hover:bg-eg-primary-hover"
          >
            {t("retry")}
            <RotateCcw className="ml-2 h-4 w-4" aria-hidden="true" />
          </button>
          <Link
            href="/comunidades"
            className="inline-flex items-center rounded-full border border-eg-border px-5 py-2.5 text-sm font-semibold text-eg-strong transition hover:bg-eg-hover"
          >
            {t("explore")}
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
