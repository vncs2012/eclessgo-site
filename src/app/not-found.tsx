import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <div className="site-shell flex min-h-screen items-center justify-center px-4 py-16">
      <div className="grid-noise absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="glass-card relative z-10 max-w-xl rounded-[2rem] p-8 text-center sm:p-10">
        <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">{t("code")}</p>
        <h1 className="section-title mt-4 text-4xl font-semibold text-zinc-50">
          {t("title")}
        </h1>
        <p className="mt-4 text-sm leading-7 text-zinc-400">
          {t("description")}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
          >
            {t("home")}
          </Link>
          <Link
            href="/comunidades"
            className="inline-flex rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold text-zinc-100 transition hover:border-emerald-400/30 hover:text-white"
          >
            {t("explore")}
          </Link>
        </div>
      </div>
    </div>
  );
}
