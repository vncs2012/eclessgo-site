import { ImageResponse } from "next/og";

import { PUBLIC_CACHE_TTL_SECONDS } from "@/lib/public-cache";
import { ApiRequestError, getPublicChurchBySlug } from "@/lib/public-api";

export const alt = "Comunidade no diretório EclessGO";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 300;

type Params = { slug: string };

async function loadChurchSafe(slug: string) {
  try {
    return await getPublicChurchBySlug(slug, {
      next: { revalidate: PUBLIC_CACHE_TTL_SECONDS.churchDetail },
    });
  } catch (error) {
    if (error instanceof ApiRequestError && error.statusCode === 404) {
      return null;
    }
    return null;
  }
}

export default async function ChurchOpengraphImage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const church = await loadChurchSafe(slug);
  const name = church?.name ?? "Comunidade";
  const locality = church
    ? [church.city, church.state].filter(Boolean).join(" - ")
    : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background:
            "linear-gradient(135deg, #064e3b 0%, #047857 55%, #10b981 100%)",
          fontFamily: "system-ui, sans-serif",
          color: "#ecfdf5",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "#a7f3d0",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "rgba(255,255,255,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 800,
              color: "#ecfdf5",
            }}
          >
            E
          </div>
          EclessGO · Comunidade
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 30,
              fontWeight: 500,
              color: "#a7f3d0",
              letterSpacing: 0.5,
            }}
          >
            {locality || "Diretório público"}
          </div>
          <div
            style={{
              fontSize: 84,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2.5,
              maxWidth: 1040,
              color: "#ffffff",
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.4,
              color: "#d1fae5",
              maxWidth: 880,
            }}
          >
            Encontre horários, contato e localização desta comunidade no EclessGO.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            color: "#a7f3d0",
          }}
        >
          <span>eclessgo.com/comunidades/{slug}</span>
          <span>Diretório público</span>
        </div>
      </div>
    ),
    size,
  );
}
