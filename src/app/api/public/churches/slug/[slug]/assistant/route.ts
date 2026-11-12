import {
  createAssistantProtection,
  createProtectionStoreFromEnv,
  readAssistantProtectionLimits,
} from "@/lib/public-assistant-protection";
import { ApiRequestError, getPublicChurchBySlug } from "@/lib/public-api";
import { createPublicInformationAssistantHandler } from "@/lib/public-information-assistant";
import { resolvePublicInformationAssistant } from "@/lib/public-information-assistant-resolver";

type AssistantRouteContext = {
  params: Promise<{ slug: string }>;
};

// Module scope so counters and cache survive across requests on a warm instance.
const protection = createAssistantProtection({
  store: createProtectionStoreFromEnv(process.env),
  limits: () => readAssistantProtectionLimits(process.env),
  env: () => process.env,
});

const handleAssistantRequest = createPublicInformationAssistantHandler({
  protection,
  resolveAdapter: resolvePublicInformationAssistant,
  async readPublicChurch(slug) {
    try {
      return await getPublicChurchBySlug(slug, { cache: "no-store" });
    } catch (error) {
      if (error instanceof ApiRequestError && error.statusCode === 404) {
        throw Object.assign(new Error("Community not found"), { status: 404 });
      }
      throw error;
    }
  },
});

export async function POST(
  request: Request,
  context: AssistantRouteContext,
): Promise<Response> {
  const { slug } = await context.params;
  return handleAssistantRequest(request, slug);
}
