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

export function PublicInformationAssistant({ slug, available = false }: { slug: string; available?: boolean }) {
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
      className="mt-8 rounded-3xl border border-eg-border bg-eg-surface p-5 text-eg-text sm:p-8"
      aria-labelledby="public-information-assistant-title"
    >
      <div className="max-w-3xl">
        <h2 id="public-information-assistant-title" className="font-display text-xl font-extrabold tracking-[-0.02em] text-eg-strong">
          {translations("title")}
        </h2>
        <p className="mt-2 text-sm leading-7 text-eg-text">{translations("description")}</p>
        <p className={available
          ? "mt-3 rounded-xl bg-[var(--eg-feedback-success-soft)] px-4 py-3 text-sm text-[var(--eg-feedback-success-text)]"
          : "mt-3 rounded-xl bg-eg-warm-soft px-4 py-3 text-sm text-eg-strong"}>
          {translations(available ? "availabilityReady" : "availability")}
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} aria-busy={viewState.pending}>
          <label htmlFor={questionId} className="block text-sm font-semibold text-eg-strong">
            {translations("questionLabel")}
          </label>
          <textarea
            id={questionId}
            className="min-h-28 w-full rounded-2xl border border-eg-border-strong/70 bg-eg-app px-4 py-3 text-sm leading-6 text-eg-strong placeholder:text-eg-muted outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-eg-focus disabled:opacity-60"
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
          <p id={`${questionId}-count`} className="text-right text-xs text-eg-muted">
            {translations("characterCount", { count: questionLength, max: MAX_QUESTION_CODE_POINTS })}
          </p>
          <p id={`${questionId}-privacy`} className="text-xs leading-6 text-eg-muted">
            {translations("privacyNotice")}
          </p>
          {viewState.pending ? (
            <p role="status" aria-live="polite" className="text-sm text-[var(--eg-feedback-success-text)]">
              {translations("pending")}
            </p>
          ) : null}
          {viewState.error ? (
            <p role="alert" className="text-sm text-eg-warm">
              {translations(viewState.error)}
            </p>
          ) : null}
          <button
            className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-eg-primary px-5 py-2 text-sm font-bold text-eg-inverse transition-colors hover:bg-eg-primary-hover outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-eg-focus disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
            disabled={!canSubmit}
          >
            {translations("submit")}
          </button>
        </form>

        {viewState.turns.length > 0 ? (
          <ol className="mt-8 space-y-5" aria-label={translations("conversationLabel")}>
            {viewState.turns.map((turn, index) => (
              <li key={`${index}-${turn.question}`} className="rounded-2xl border border-eg-border bg-eg-app p-5">
                <p className="text-sm font-semibold text-eg-strong">
                  {translations("you")}: {turn.question}
                </p>
                {turn.result.status === "no_information" ? (
                  <p className="mt-4 text-sm leading-7 text-eg-text">{translations("noInformation")}</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm font-medium text-eg-strong">{translations("answerHeading")}</p>
                    <ul className="space-y-3">
                      {turn.result.answer.map((answer, answerIndex) => {
                        const source = turn.result.status === "answered"
                          ? turn.result.sources[answerIndex]
                          : undefined;
                        return (
                          <li key={`${answerIndex}-${source?.factId || "answer"}`} className="rounded-xl bg-eg-surface p-4">
                            <p className="whitespace-pre-wrap text-sm leading-7 text-eg-text">{answer}</p>
                            {source ? (
                              <a className="mt-2 inline-flex rounded-sm text-sm font-semibold text-eg-primary-text underline underline-offset-4 outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-eg-focus" href={source.href}>
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
