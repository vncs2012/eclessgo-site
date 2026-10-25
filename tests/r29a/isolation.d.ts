declare const process: { env: Record<string, string | undefined> };
declare module "next-intl/server" {
  export function getLocale(): Promise<string>;
}
declare module "@/lib/public-api" {
  export function getPublicActivityCatalogue(
    query: Record<string, string | string[] | undefined>
  ): Promise<import("../../src/lib/public-activity-catalog").CatalogueResult>;
}
