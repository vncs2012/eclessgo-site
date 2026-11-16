import { Bus, Info, MapPin, Navigation, ParkingSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ComponentType, SVGProps } from "react";

import { ChurchMap } from "@/components/site/church-map";
import { CommunityCopyAddress } from "@/components/site/community-copy-address";
import { COMMUNITY_FOCUS, CommunitySection } from "@/components/site/community-section";
import { EXTERNAL_LINK_REL, EXTERNAL_LINK_TARGET } from "@/lib/public-church-profile";
import type { CommunityAddress } from "@/lib/public-community-page";
import { cn } from "@/lib/utils";
import type { PublicChurchListItem } from "@/types/public";

/** Orientações de chegada (`directions` da API: entrada, ônibus, estacionamento); cada uma é opcional. */
export type CommunityAccess = {
  entrance?: string | null;
  bus?: string | null;
  parking?: string | null;
};

type CommunityDirectionsProps = {
  name: string;
  address: CommunityAddress;
  /** A própria comunidade como item do mapa (pin 1); nulo sem coordenadas. */
  mapItem: PublicChurchListItem | null;
  googleMapsHref: string | null;
  wazeHref: string | null;
  access?: CommunityAccess;
};

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const BUTTON =
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full px-[18px] text-[14.5px] font-bold transition-colors";

export function CommunityDirections({
  name,
  address,
  mapItem,
  googleMapsHref,
  wazeHref,
  access,
}: CommunityDirectionsProps) {
  const t = useTranslations("communityPage.directions");

  if (!address.hasAddress && !mapItem) return null;

  const details: Array<{ key: string; icon: Icon; label: string; value: string }> = [];
  if (access?.entrance) details.push({ key: "entrance", icon: Info, label: t("entrance"), value: access.entrance });
  if (access?.bus) details.push({ key: "bus", icon: Bus, label: t("bus"), value: access.bus });
  if (access?.parking) {
    details.push({ key: "parking", icon: ParkingSquare, label: t("parking"), value: access.parking });
  }

  return (
    <CommunitySection id="como-chegar" title={t("title")}>
      <div className={cn("grid items-start gap-7", mapItem && "md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]")}>
        {mapItem ? (
          <div
            role="group"
            aria-label={t("mapLabel", { name })}
            className="relative isolate h-[340px] overflow-hidden rounded-[20px] border border-eg-border"
          >
            <ChurchMap churches={[mapItem]} center={mapItem.location} selectedChurchId={mapItem.id} />
          </div>
        ) : null}

        <div>
          <ul className="grid gap-3.5 text-[15.5px] text-eg-text">
            {address.hasAddress ? (
              <li className="flex items-start gap-3">
                <MapPin className="mt-[3px] h-[18px] w-[18px] shrink-0 text-eg-primary-text" aria-hidden="true" />
                <div>
                  <p className="font-bold text-eg-strong">{address.lineOne}</p>
                  {address.lineTwo ? <p>{address.lineTwo}</p> : null}
                </div>
              </li>
            ) : null}
            {details.map(({ key, icon: IconComponent, label, value }) => (
              <li key={key} className="flex items-start gap-3">
                <IconComponent className="mt-[3px] h-[18px] w-[18px] shrink-0 text-eg-primary-text" aria-hidden="true" />
                <div>
                  <p className="font-bold text-eg-strong">{label}</p>
                  <p>{value}</p>
                </div>
              </li>
            ))}
          </ul>

          {googleMapsHref || wazeHref ? (
            <div className="mt-[18px] flex flex-wrap gap-2.5">
              {googleMapsHref ? (
                <a
                  href={googleMapsHref}
                  data-track="maps"
                  target={EXTERNAL_LINK_TARGET}
                  rel={EXTERNAL_LINK_REL}
                  className={cn(
                    BUTTON,
                    "bg-eg-primary text-eg-inverse shadow-[var(--eg-shadow-md)] hover:bg-eg-primary-hover",
                    COMMUNITY_FOCUS,
                  )}
                >
                  <Navigation className="h-[18px] w-[18px]" aria-hidden="true" />
                  <span className="font-bold">{t("googleMaps")}</span>
                </a>
              ) : null}
              {wazeHref ? (
                <a
                  href={wazeHref}
                  data-track="waze"
                  target={EXTERNAL_LINK_TARGET}
                  rel={EXTERNAL_LINK_REL}
                  className={cn(
                    BUTTON,
                    "border-[1.5px] border-eg-border-strong text-eg-strong hover:bg-eg-hover",
                    COMMUNITY_FOCUS,
                  )}
                >
                  <span className="font-bold">{t("waze")}</span>
                </a>
              ) : null}
            </div>
          ) : null}
          {address.hasAddress ? (
            <div className="mt-1">
              <CommunityCopyAddress address={address.full} />
            </div>
          ) : null}
        </div>
      </div>
    </CommunitySection>
  );
}
