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
      <div className="glass-card relative z-10 max-w-2xl rounded-[2rem] p-8 text-center sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-amber-200">
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        </div>

        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
          {t("eyebrow")}
        </p>
        <h1 className="section-title mt-4 text-4xl font-semibold text-zinc-50">
          {t("title")}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-zinc-400">
          {t("description")}
        </p>

        {error.digest ? (
          <p className="mx-auto mt-5 inline-flex rounded-full border border-white/10 bg-zinc-950/70 px-3 py-1 text-xs text-zinc-500">
            {t("supportCode", { digest: error.digest })}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
          >
            {t("retry")}
            <RotateCcw className="ml-2 h-4 w-4" aria-hidden="true" />
          </button>
          <Link
            href="/comunidades"
            className="inline-flex items-center rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold text-zinc-100 transition hover:border-emerald-400/30 hover:text-white"
          >
            {t("explore")}
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
