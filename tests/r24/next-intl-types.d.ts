export function useLocale(): string;

export function useTranslations(
  namespace: string,
): (key: string, values?: Record<string, string | number>) => string;
