export class ApiRequestError extends Error {
  statusCode: number;
}

export function getPublicChurchBySlug(
  slug: string,
  options?: { cache?: "no-store" },
): Promise<unknown>;
