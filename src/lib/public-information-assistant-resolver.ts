import "server-only";

import { DEFAULT_API_BASE_URL } from "@/lib/site-config";
import { PUBLIC_UPSTREAM_TIMEOUT_MS } from "@/lib/public-bff";
import type {
  PublicInformationAssistantResolution,
  PublicInformationAssistantTimer,
} from "./public-information-assistant";
import { createProviderAdapter, type PublicInformationProviderConfig } from "./public-information-assistant-provider";

type Environment = Readonly<Record<string, string | undefined>>;

type ResolverOptions = {
  env?: Environment;
  fetchSelection?: typeof fetch;
  fetchProvider?: typeof fetch;
  timer?: PublicInformationAssistantTimer;
};

function nonempty(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function outputLimit(value: string | undefined): number | null {
  const raw = value?.trim();
  if (!raw || !/^[1-9][0-9]*$/.test(raw)) return null;
  const number = Number(raw);
  return Number.isSafeInteger(number) ? number : null;
}

function providerConfig(provider: "openai" | "anthropic", env: Environment): PublicInformationProviderConfig | null {
  if (provider === "openai") {
    const apiKey = nonempty(env.OPENAI_API_KEY);
    const model = nonempty(env.ASSISTANT_OPENAI_MODEL);
    const maxOutputTokens = outputLimit(env.ASSISTANT_OPENAI_MAX_OUTPUT_TOKENS);
    return apiKey && model && maxOutputTokens ? { provider, apiKey, model, maxOutputTokens } : null;
  }

  const apiKey = nonempty(env.ANTHROPIC_API_KEY);
  const model = nonempty(env.ASSISTANT_ANTHROPIC_MODEL);
  const maxOutputTokens = outputLimit(env.ASSISTANT_ANTHROPIC_MAX_OUTPUT_TOKENS);
  const workspaceId = nonempty(env.ASSISTANT_ANTHROPIC_WORKSPACE_ID) ?? undefined;
  return apiKey && model && maxOutputTokens ? { provider, apiKey, model, maxOutputTokens, workspaceId } : null;
}

async function readSelection(
  transport: typeof fetch,
  timer: PublicInformationAssistantTimer,
): Promise<unknown> {
  const controller = new AbortController();
  let timeoutHandle: unknown;
  let hasTimeoutHandle = false;
  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutHandle = timer.setTimeout(() => {
      controller.abort();
      reject(new Error("Selection unavailable"));
    }, PUBLIC_UPSTREAM_TIMEOUT_MS);
    hasTimeoutHandle = true;
  });
  try {
    const request = Promise.resolve().then(async () => {
      const url = new URL(`${DEFAULT_API_BASE_URL.replace(/\/+$/, "")}/public/assistant-provider`);
      const response = await transport(url.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
        redirect: "error",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Selection unavailable");
      return await response.json() as unknown;
    });
    return await Promise.race([request, timeout]);
  } finally {
    if (hasTimeoutHandle) timer.clearTimeout(timeoutHandle);
  }
}

export async function resolvePublicInformationAssistant(
  options: ResolverOptions = {},
): Promise<PublicInformationAssistantResolution> {
  const env = options.env ?? process.env;
  if (env.ASSISTANT_ENABLED !== "true") return { kind: "not-configured" };
  const timer = options.timer ?? {
    setTimeout: (handler: () => void, delayMs: number) => setTimeout(handler, delayMs),
    clearTimeout: (handle: unknown) => clearTimeout(handle as ReturnType<typeof setTimeout>),
  };

  let value: unknown;
  try {
    value = await readSelection(options.fetchSelection ?? fetch, timer);
  } catch {
    return { kind: "unavailable" };
  }
  let provider: unknown;
  try {
    if (typeof value !== "object" || value === null || Array.isArray(value) ||
        Reflect.ownKeys(value).length !== 1 || !Object.hasOwn(value, "provider")) {
      return { kind: "unavailable" };
    }
    provider = (value as { provider: unknown }).provider;
  } catch {
    return { kind: "unavailable" };
  }
  if (provider === null) return { kind: "not-configured" };
  if (provider !== "openai" && provider !== "anthropic") return { kind: "unavailable" };

  const config = providerConfig(provider, env);
  if (!config) return { kind: "not-configured" };
  return { kind: "ready", adapter: createProviderAdapter(config, options.fetchProvider ?? fetch) };
}
