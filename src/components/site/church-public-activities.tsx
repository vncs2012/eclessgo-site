import { getLocale } from "next-intl/server";
import { activityCatalogueHref, type CatalogueResult } from "../../lib/public-activity-catalog";
import { isCanonicalUuid, panelActivityHref } from "../../lib/public-panel-activity-origin";
import pt from "../../i18n/messages/activity-interest/pt-BR";
import en from "../../i18n/messages/activity-interest/en";

function messages(locale: string) {
  return locale === "en" ? en : pt;
}

// This wrapper obtains its own locale; the mixed profile needs only import + JSX.
export async function ChurchPublicActivities({ churchId }: { churchId: string }) {
  const t = messages(await getLocale());
  if (!isCanonicalUuid(churchId)) return <p role="status">{t.profileUnavailable}</p>;
  return (
    <p className="mt-6">
      <a className="inline-flex min-h-11 items-center rounded-full border border-emerald-400/30 px-5 py-3 text-sm font-semibold text-emerald-300"
        href={"/atividades?church_id=" + churchId}>{t.profileLink}</a>
    </p>
  );
}

export function PublicActivityCatalogueView({ result, locale, panelOrigin }: {
  result: CatalogueResult; locale: string; panelOrigin: string | undefined;
}) {
  const t = messages(locale);
  return (
    <main lang={locale === "en" ? "en" : "pt-BR"} className="site-shell min-h-screen bg-background px-4 py-14 text-foreground">
      <div className="mx-auto max-w-4xl">
        <a className="text-sm text-emerald-300" href="/comunidades">{t.back}</a>
        <h1 className="mt-6 text-4xl font-semibold">{t.title}</h1>
        <p className="mt-4 text-zinc-300">{t.introduction}</p>
        {result.status !== "invalid" && result.query.church_id ? <p className="mt-4">{t.filtered}</p> : null}
        {result.status === "invalid" ? <p className="mt-8" role="alert">{t.invalid}</p> :
          result.status === "error" ? (
            <div className="mt-8" role="alert"><p>{t.error}</p>
              <a className="mt-4 inline-block text-emerald-300" href={activityCatalogueHref(result.query)}>{t.retry}</a>
            </div>
          ) : (
            <>
              {result.status === "empty" ? <p className="mt-8" role="status">{t.empty}</p> : (
                <ul className="mt-8 grid gap-5">
                  {result.page.data.map(activity => {
                    const href = panelActivityHref(panelOrigin, activity.event_id);
                    return (
                      <li key={activity.event_id} className="glass-card rounded-3xl p-6">
                        <h2 className="text-xl font-semibold">{activity.title}</h2>
                        <p className="mt-2 text-zinc-300">{activity.church_name}</p>
                        <p className="mt-4">{t.starts}: <time dateTime={activity.start_at}>{activity.start_at}</time></p>
                        {activity.end_at ? <p>{t.ends}: <time dateTime={activity.end_at}>{activity.end_at}</time></p> : null}
                        {href ? <a className="mt-5 inline-flex min-h-11 items-center rounded-full bg-emerald-500 px-5 py-3 font-semibold text-emerald-950"
                          href={href}>{t.signIn}</a> : <p className="mt-5" role="status">{t.panelUnavailable}</p>}
                      </li>
                    );
                  })}
                </ul>
              )}
              <nav className="mt-8 flex items-center gap-5" aria-label={t.page}>
                {result.query.page > 1 ? <a href={activityCatalogueHref({ ...result.query, page: result.query.page - 1 })}>{t.previous}</a> : null}
                <span>{t.page} {result.query.page}</span>
                {result.query.page < Math.min(result.page.meta.total_pages, 1000) ?
                  <a href={activityCatalogueHref({ ...result.query, page: result.query.page + 1 })}>{t.next}</a> : null}
              </nav>
            </>
          )}
      </div>
    </main>
  );
}

export function PublicActivityLoadingView({ locale }: { locale: string }) {
  const t = messages(locale);
  return (
    <main lang={locale === "en" ? "en" : "pt-BR"} role="status" aria-live="polite" aria-busy="true"
      className="site-shell min-h-screen bg-background px-4 py-14 text-foreground">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-semibold">{t.title}</h1>
        <p className="mt-6">{t.loading}</p>
      </div>
    </main>
  );
}
