const COMMUNITY_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Builds the only public path that may be used by the community-detail App CTA.
 *
 * Keeping this helper limited to a validated slug prevents user-controlled data
 * from becoming a scheme, host, or arbitrary deep-link target. Invalid values
 * deliberately fall back to the public communities index.
 */
export function buildCommunityUniversalPath(slug: string): string {
  const normalizedSlug = slug.trim();
  if (!COMMUNITY_SLUG_PATTERN.test(normalizedSlug)) return "/comunidades";
  return `/comunidades/${encodeURIComponent(normalizedSlug)}`;
}

/**
 * Returns an absolute universal-link URL for configured public sites and a
 * relative Web fallback for local/invalid origins.
 */
export function buildCommunityUniversalUrl(slug: string, siteUrl: string): string {
  const path = buildCommunityUniversalPath(slug);
  try {
    const origin = new URL(siteUrl);
    if (!/^https?:$/.test(origin.protocol) || /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$/i.test(origin.hostname)) {
      return path;
    }
    return new URL(path, `${origin.origin}/`).toString();
  } catch {
    return path;
  }
}
