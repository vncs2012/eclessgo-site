export type PublicInformationLocale = "pt-BR" | "en";

export interface PublicInformationFact {
  id: string;
  text: string;
}

export interface PublicInformationSelectionInput {
  question: string;
  locale: PublicInformationLocale;
  slug: string;
  facts: readonly PublicInformationFact[];
  signal: AbortSignal;
}

export interface PublicInformationAssistantAdapter {
  select(input: PublicInformationSelectionInput): Promise<unknown> | unknown;
}

export interface PublicInformationAssistantTimer {
  setTimeout(handler: () => void, delayMs: number): unknown;
  clearTimeout(handle: unknown): void;
}

export interface PublicInformationAssistantDependencies {
  readPublicChurch(slug: string): Promise<unknown> | unknown;
  adapter?: PublicInformationAssistantAdapter | null;
  timer?: PublicInformationAssistantTimer;
}

const REQUEST_BODY_LIMIT_BYTES = 4096;
const QUESTION_LIMIT_CODE_POINTS = 500;
const PUBLIC_TEXT_LIMIT_CODE_POINTS = 2000;
const PUBLIC_SCHEDULE_LIMIT = 30;
const ADAPTER_TIMEOUT_MS = 5000;
const SOURCE_PATH = (slug: string) => `/comunidades/${slug}`;

class RequestTooLargeError extends Error {}

const FACT_LABELS = {
  "pt-BR": {
    name: "Nome da comunidade",
    denomination: "Denominação",
    description: "Descrição pública",
    address: "Endereço",
    neighborhood: "Bairro",
    city: "Cidade",
    state: "Estado",
    schedule: "Atividade pública",
  },
  en: {
    name: "Community name",
    denomination: "Denomination",
    description: "Public description",
    address: "Address",
    neighborhood: "Neighborhood",
    city: "City",
    state: "State",
    schedule: "Public activity",
  },
} satisfies Record<PublicInformationLocale, Record<string, string>>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function boundedPublicText(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const text = value.trim();
  if (!text) return null;

  let codePoints = 0;
  for (const _codePoint of text) {
    codePoints += 1;
    if (codePoints > PUBLIC_TEXT_LIMIT_CODE_POINTS) return null;
  }

  return text;
}

function firstPublicText(record: Record<string, unknown>, keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = boundedPublicText(record[key]);
    if (value !== null) return value;
  }
  return null;
}

export function projectPublicInformationFacts(
  source: unknown,
  expectedSlug: string,
  locale: PublicInformationLocale,
): PublicInformationFact[] | null {
  if (!isRecord(source) || source.slug !== expectedSlug) return null;

  const labels = FACT_LABELS[locale];
  const facts: PublicInformationFact[] = [];
  const addFact = (id: string, label: string, value: string | null) => {
    if (value !== null) facts.push({ id, text: `${label}: ${value}` });
  };

  addFact("church-name", labels.name, boundedPublicText(source.name));
  addFact("denomination", labels.denomination, boundedPublicText(source.denomination));
  addFact("description", labels.description, boundedPublicText(source.description));

  const addressLine = boundedPublicText(source.addressLine);
  if (addressLine && addressLine.toLocaleLowerCase() !== "endereço não informado") {
    addFact("address", labels.address, addressLine);
  }
  addFact("neighborhood", labels.neighborhood, boundedPublicText(source.neighborhood));
  addFact("city", labels.city, boundedPublicText(source.city));
  addFact("state", labels.state, boundedPublicText(source.state));

  if (Array.isArray(source.schedule)) {
    const scheduleCount = Math.min(source.schedule.length, PUBLIC_SCHEDULE_LIMIT);
    for (let index = 0; index < scheduleCount; index += 1) {
      const entry = source.schedule[index];
      if (typeof entry === "string") {
        addFact(`schedule-${index + 1}`, labels.schedule, boundedPublicText(entry));
        continue;
      }
      if (!isRecord(entry)) continue;

      const title = firstPublicText(entry, ["title", "name", "service", "label"]);
      if (title === null) continue;

      const details = [
        title,
        firstPublicText(entry, ["day", "weekday", "date"]),
        firstPublicText(entry, ["time", "start_time", "hour"]),
        firstPublicText(entry, ["description", "details", "notes"]),
      ].filter((value): value is string => value !== null);

      addFact(`schedule-${index + 1}`, labels.schedule, details.join("; "));
    }
  }

  return facts;
}

function isValidSlug(slug: unknown): slug is string {
  return typeof slug === "string" &&
    slug.length <= 120 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function hasExactKeys(record: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Reflect.ownKeys(record);
  return keys.length === expected.length &&
    keys.every((key) => typeof key === "string" && expected.includes(key));
}

async function readJsonBody(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError("Missing request body");

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > REQUEST_BODY_LIMIT_BYTES) {
        void reader.cancel().catch(() => undefined);
        throw new RequestTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}

function parseAssistantRequest(value: unknown): {
  question: string;
  locale: PublicInformationLocale;
} | null {
  if (!isRecord(value) || !hasExactKeys(value, ["question", "locale"])) return null;
  if (typeof value.question !== "string") return null;
  if (value.locale !== "pt-BR" && value.locale !== "en") return null;

  const question = value.question.trim();
  if (!question || [...question].length > QUESTION_LIMIT_CODE_POINTS) return null;
  return { question, locale: value.locale };
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === null || Object.getPrototypeOf(prototype) === null;
}

function selectFacts(
  value: unknown,
  factsById: Map<string, PublicInformationFact>,
): PublicInformationFact[] | null {
  try {
    if (!isPlainRecord(value) || !hasExactKeys(value, ["factIds"])) return null;

    const descriptor = Object.getOwnPropertyDescriptor(value, "factIds");
    if (!descriptor || !descriptor.enumerable || !("value" in descriptor)) return null;
    if (!Array.isArray(descriptor.value) || descriptor.value.length > 8) return null;

    const selected: PublicInformationFact[] = [];
    const seen = new Set<string>();
    for (const factId of descriptor.value) {
      if (typeof factId !== "string" || seen.has(factId)) return null;
      const fact = factsById.get(factId);
      if (!fact) return null;
      seen.add(factId);
      selected.push(fact);
    }
    return selected;
  } catch {
    return null;
  }
}

function jsonResponse(status: number, payload: Record<string, unknown>): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function failure(status: number, code: string): Response {
  return jsonResponse(status, { code });
}

function isNotFound(error: unknown): boolean {
  try {
    return isRecord(error) && error.status === 404;
  } catch {
    return false;
  }
}

export function createPublicInformationAssistantHandler(
  dependencies: PublicInformationAssistantDependencies,
): (request: Request, slug: string) => Promise<Response> {
  const timer = dependencies.timer ?? {
    setTimeout: (handler: () => void, delayMs: number) => setTimeout(handler, delayMs),
    clearTimeout: (handle: unknown) => clearTimeout(handle as ReturnType<typeof setTimeout>),
  };

  return async (request, slug) => {
    if (!isValidSlug(slug)) return failure(400, "INVALID_REQUEST");

    let body: unknown;
    try {
      body = await readJsonBody(request);
    } catch (error) {
      if (error instanceof RequestTooLargeError) return failure(413, "REQUEST_TOO_LARGE");
      return failure(400, "INVALID_REQUEST");
    }

    const input = parseAssistantRequest(body);
    if (!input) return failure(400, "INVALID_REQUEST");
    if (!dependencies.adapter) return failure(503, "ASSISTANT_NOT_CONFIGURED");

    let church: unknown;
    try {
      church = await dependencies.readPublicChurch(slug);
    } catch (error) {
      return isNotFound(error)
        ? failure(404, "COMMUNITY_NOT_FOUND")
        : failure(503, "PUBLIC_INFORMATION_UNAVAILABLE");
    }
    if (church === null || church === undefined) return failure(404, "COMMUNITY_NOT_FOUND");

    let facts: PublicInformationFact[] | null;
    try {
      facts = projectPublicInformationFacts(church, slug, input.locale);
    } catch {
      return failure(503, "PUBLIC_INFORMATION_UNAVAILABLE");
    }
    if (!facts) return failure(503, "PUBLIC_INFORMATION_UNAVAILABLE");

    const factsById = new Map<string, PublicInformationFact>();
    for (const fact of facts) factsById.set(fact.id, { id: fact.id, text: fact.text });
    const adapterFacts = Object.freeze(
      facts.map((fact) => Object.freeze({ id: fact.id, text: fact.text })),
    ) as readonly PublicInformationFact[];

    const controller = new AbortController();
    let timedOut = false;
    let timeoutHandle: unknown;
    let hasTimeoutHandle = false;
    const timeout = new Promise<never>((_resolve, reject) => {
      timeoutHandle = timer.setTimeout(() => {
        timedOut = true;
        controller.abort();
        reject(new Error("Assistant selection timed out"));
      }, ADAPTER_TIMEOUT_MS);
      hasTimeoutHandle = true;
    });

    let selection: unknown;
    try {
      const adapterResult = Promise.resolve().then(() => dependencies.adapter!.select({
        question: input.question,
        locale: input.locale,
        slug,
        facts: adapterFacts,
        signal: controller.signal,
      }));
      selection = await Promise.race([adapterResult, timeout]);
    } catch {
      return timedOut
        ? failure(504, "ASSISTANT_TIMEOUT")
        : failure(503, "ASSISTANT_UNAVAILABLE");
    } finally {
      if (hasTimeoutHandle) timer.clearTimeout(timeoutHandle);
    }

    const selectedFacts = selectFacts(selection, factsById);
    if (!selectedFacts) return failure(502, "INVALID_PROVIDER_RESPONSE");
    if (selectedFacts.length === 0) {
      return jsonResponse(200, { slug, status: "no_information", answer: [], sources: [] });
    }

    return jsonResponse(200, {
      slug,
      status: "answered",
      answer: selectedFacts.map((fact) => fact.text),
      sources: selectedFacts.map((fact) => ({ factId: fact.id, href: SOURCE_PATH(slug) })),
    });
  };
}
