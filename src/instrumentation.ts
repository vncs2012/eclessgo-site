import { registerServerObservability } from "@/lib/observability-server";

export async function register() {
  await registerServerObservability();
}
