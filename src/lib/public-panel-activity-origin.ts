const CANONICAL_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function isCanonicalUuid(value: unknown): value is string {
  return typeof value === "string" && CANONICAL_UUID.test(value);
}

export function panelActivityHref(rawOrigin: string | undefined, eventId: string): string | null {
  if (!isCanonicalUuid(eventId) || typeof rawOrigin !== "string") return null;
  // Check the raw boundary too: URL normalization must not erase a supplied path.
  const match = /^(https?):\/\/([^/?#]+)\/?$/.exec(rawOrigin);
  if (!match || rawOrigin !== rawOrigin.trim()) return null;
  try {
    const url = new URL(rawOrigin);
    if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) return null;
    if (url.protocol === "http:" &&
        !/^(localhost|127\.0\.0\.1|\[::1\])(?::[0-9]+)?$/i.test(match[2])) return null;
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.origin + "/interesses/atividades/" + eventId;
  } catch {
    return null;
  }
}
