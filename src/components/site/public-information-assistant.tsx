"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type AssistantLocale = "pt-BR" | "en";
type AssistantError = "notConfigured" | "unavailable" | "invalidResponse";

type AssistantSource = {
  factId: string;
  href: string;
};

type AssistantResult =
  | { status: "answered"; answer: string[]; sources: AssistantSource[] }
  | { status: "no_information"; answer: []; sources: [] };

type AssistantTurn = {
  question: string;
  result: AssistantResult;
};

type AssistantViewState = {
  contextKey: string;
  question: string;
  turns: AssistantTurn[];
  pending: boolean;
  error: AssistantError | null;
};

const MAX_QUESTION_CODE_POINTS = 500;
const MAX_TURNS = 10;

function emptyViewState(contextKey: string): AssistantViewState {
  return { contextKey, question: "", turns: [], pending: false, error: null };
}

function codePointCount(value: string): number {
  return Array.from(value).length;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(record: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Reflect.ownKeys(record);
  return keys.length === expected.length &&
    keys.every((key) => typeof key === "string" && expected.includes(key));
}

function isValidSlug(slug: string): boolean {
  return slug.length <= 120 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function parseAssistantResult(value: unknown, slug: string): AssistantResult | null {
  if (!isRecord(value) || !hasExactKeys(value, ["slug", "status", "answer", "sources"])) return null;
  if (value.slug !== slug || !isValidSlug(slug)) return null;
  if (!Array.isArray(value.answer) || !Array.isArray(value.sources)) return null;

  if (value.status === "no_information") {
    if (value.answer.length !== 0 || value.sources.length !== 0) return null;
    return { status: "no_information", answer: [], sources: [] };
  }

  if (value.status !== "answered" || value.answer.length < 1 || value.answer.length > 8) return null;
  if (value.sources.length !== value.answer.length) return null;

  const answer: string[] = [];
  for (const item of value.answer) {
    if (typeof item !== "string" || item.trim().length === 0) return null;
    answer.push(item);
  }

  const expectedHref = `/comunidades/${slug}`;
  const factIds = new Set<string>();
  const sources: AssistantSource[] = [];
  for (const item of value.sources) {
    if (!isRecord(item) || !hasExactKeys(item, ["factId", "href"])) return null;
    if (typeof item.factId !== "string" || item.factId.length === 0 || factIds.has(item.factId)) return null;
    if (item.href !== expectedHref) return null;
    factIds.add(item.factId);
    sources.push({ factId: item.factId, href: expectedHref });
  }

  return { status: "answered", answer, sources };
}

function isNotConfiguredError(value: unknown): boolean {
  return isRecord(value) && hasExactKeys(value, ["code"]) && value.code === "ASSISTANT_NOT_CONFIGURED";
}

export function PublicInformationAssistant({ slug }: { slug: string }) {
  const translations = useTranslations("publicAssistant");
  const localeValue = useLocale();
  const locale: AssistantLocale = localeValue === "pt-BR" ? "pt-BR" : "en";
  const contextKey = `${slug}\u0000${locale}`;
  const questionId = "public-information-assistant-question";
  const contextRef = useRef(contextKey);
  const requestGenerationRef = useRef(0);
  const requestControllerRef = useRef<AbortController | null>(null);
  const [storedState, setStoredState] = useState<AssistantViewState>(() => emptyViewState(contextKey));
  const viewState = storedState.contextKey === contextKey ? storedState : emptyViewState(contextKey);

  contextRef.current = contextKey;

  useLayoutEffect(() => {
    setStoredState((current) => current.contextKey === contextKey ? current : emptyViewState(contextKey));
    return () => {
      requestGenerationRef.current += 1;
      requestControllerRef.current?.abort();
      requestControllerRef.current = null;
    };
  }, [contextKey]);

  const questionLength = codePointCount(viewState.question.trim());
  const canSubmit = isValidSlug(slug) &&
    viewState.question.trim().length > 0 &&
    questionLength <= MAX_QUESTION_CODE_POINTS &&
    !viewState.pending;

  async function handleSubmit(event: { preventDefault(): void }) {
    event.preventDefault();
    const question = viewState.question.trim();
    if (!canSubmit || !question || requestControllerRef.current) return;

    const requestContext = contextKey;
    const requestGeneration = ++requestGenerationRef.current;
    const controller = new AbortController();
    requestControllerRef.current = controller;
    setStoredState((current) => {
      const base = current.contextKey === requestContext ? current : emptyViewState(requestContext);
      return { ...base, pending: true, error: null };
    });

    const isCurrentRequest = () =>
      !controller.signal.aborted &&
      contextRef.current === requestContext &&
      requestGenerationRef.current === requestGeneration;
    const updateCurrentState = (update: (current: AssistantViewState) => AssistantViewState) => {
      setStoredState((current) => {
        if (!isCurrentRequest()) return current;
        const base = current.contextKey === requestContext ? current : emptyViewState(requestContext);
        return update(base);
      });
    };

    try {
      const response = await fetch(`/api/public/churches/slug/${slug}/assistant`, {
        method: "POST",
        credentials: "omit",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, locale }),
        signal: controller.signal,
      });

      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }
      if (!isCurrentRequest()) return;

      if (response.status === 503 && isNotConfiguredError(payload)) {
        updateCurrentState((current) => ({ ...current, error: "notConfigured" }));
      } else if (!response.ok) {
        updateCurrentState((current) => ({ ...current, error: "unavailable" }));
      } else if (response.status !== 200) {
        updateCurrentState((current) => ({ ...current, error: "invalidResponse" }));
      } else {
        const result = parseAssistantResult(payload, slug);
        if (!result) {
          updateCurrentState((current) => ({ ...current, error: "invalidResponse" }));
        } else {
          updateCurrentState((current) => ({
            ...current,
            question: "",
            error: null,
            turns: [...current.turns, { question, result }].slice(-MAX_TURNS),
          }));
        }
      }
    } catch {
      if (isCurrentRequest()) {
        updateCurrentState((current) => ({ ...current, error: "unavailable" }));
      }
    } finally {
      if (isCurrentRequest()) {
        requestControllerRef.current = null;
        setStoredState((current) => current.contextKey === requestContext
          ? { ...current, pending: false }
          : current);
      }
    }
  }

  return (
    <section
      className="glass-card mt-8 rounded-[1.9rem] border border-white/10 p-6 sm:p-8"
      aria-labelledby="public-information-assistant-title"
    >
      <div className="max-w-3xl">
        <h2 id="public-information-assistant-title" className="text-xl font-semibold text-zinc-50">
          {translations("title")}
        </h2>
        <p className="mt-2 text-sm leading-7 text-zinc-300">{translations("description")}</p>
        <p className="mt-3 rounded-xl border border-amber-300/20 bg-amber-400/5 px-4 py-3 text-sm text-amber-100">
          {translations("availability")}
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} aria-busy={viewState.pending}>
          <label htmlFor={questionId} className="block text-sm font-semibold text-zinc-100">
            {translations("questionLabel")}
          </label>
          <textarea
            id={questionId}
            className="min-h-28 w-full rounded-2xl border border-white/15 bg-zinc-950/70 px-4 py-3 text-sm leading-6 text-zinc-50 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/30 disabled:opacity-60"
            value={viewState.question}
            onChange={(event) => {
              const question = event.target.value;
              setStoredState((current) => {
                const base = current.contextKey === contextKey ? current : emptyViewState(contextKey);
                return { ...base, question };
              });
            }}
            placeholder={translations("questionPlaceholder")}
            aria-describedby={`${questionId}-count ${questionId}-privacy`}
            rows={3}
            disabled={viewState.pending}
          />
          <p id={`${questionId}-count`} className="text-right text-xs text-zinc-400">
            {translations("characterCount", { count: questionLength, max: MAX_QUESTION_CODE_POINTS })}
          </p>
          <p id={`${questionId}-privacy`} className="text-xs leading-6 text-zinc-400">
            {translations("privacyNotice")}
          </p>
          {viewState.pending ? (
            <p role="status" aria-live="polite" className="text-sm text-emerald-200">
              {translations("pending")}
            </p>
          ) : null}
          {viewState.error ? (
            <p role="alert" className="text-sm text-amber-200">
              {translations(viewState.error)}
            </p>
          ) : null}
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-300 px-5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
            disabled={!canSubmit}
          >
            {translations("submit")}
          </button>
        </form>

        {viewState.turns.length > 0 ? (
          <ol className="mt-8 space-y-5" aria-label={translations("conversationLabel")}>
            {viewState.turns.map((turn, index) => (
              <li key={`${index}-${turn.question}`} className="rounded-2xl border border-white/10 bg-zinc-950/50 p-5">
                <p className="text-sm font-semibold text-zinc-100">
                  {translations("you")}: {turn.question}
                </p>
                {turn.result.status === "no_information" ? (
                  <p className="mt-4 text-sm leading-7 text-zinc-300">{translations("noInformation")}</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm font-medium text-zinc-200">{translations("answerHeading")}</p>
                    <ul className="space-y-3">
                      {turn.result.answer.map((answer, answerIndex) => {
                        const source = turn.result.status === "answered"
                          ? turn.result.sources[answerIndex]
                          : undefined;
                        return (
                          <li key={`${answerIndex}-${source?.factId || "answer"}`} className="rounded-xl bg-white/5 p-4">
                            <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-200">{answer}</p>
                            {source ? (
                              <a className="mt-2 inline-flex text-sm font-semibold text-emerald-200 underline underline-offset-4" href={source.href}>
                                {translations("sourceLink")}
                              </a>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </section>
  );
}
