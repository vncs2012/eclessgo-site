import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "EclessGO — Comunidades no mapa, encontros e presença digital";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
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
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "#a7f3d0",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "rgba(255,255,255,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 800,
              color: "#ecfdf5",
            }}
          >
            E
          </div>
          EclessGO
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 980,
            }}
          >
            Comunidades no mapa, encontros e presença digital.
          </div>
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.4,
              color: "#d1fae5",
              maxWidth: 880,
            }}
          >
            Descubra espaços, conecte pessoas e cuide da operação da sua comunidade.
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
          <span>eclessgo.com</span>
          <span>App · Painel · Comunidades públicas</span>
        </div>
      </div>
    ),
    size,
  );
}
