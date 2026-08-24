"use client";

import { useMemo, useState } from "react";
import { Check, Copy, HeartHandshake } from "lucide-react";

import { createPixQrMatrix } from "@/lib/pix-qr";
import { trackPublicEvent } from "@/lib/public-analytics";

type PixKeyDonationCardProps = {
  churchId: string;
  churchName: string;
  slug: string;
  pixKey: string;
};

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Clipboard indisponível");
}

function PixQrSvg({ matrix, label }: { matrix: ReturnType<typeof createPixQrMatrix>; label: string }) {
  const quietZone = 4;
  const viewBox = `${-quietZone} ${-quietZone} ${matrix.size + quietZone * 2} ${matrix.size + quietZone * 2}`;

  return (
    <svg
      viewBox={viewBox}
      role="img"
      aria-label={label}
      className="h-full w-full"
      shapeRendering="crispEdges"
    >
      <rect x={-quietZone} y={-quietZone} width={matrix.size + quietZone * 2} height={matrix.size + quietZone * 2} fill="white" />
      {matrix.modules.map((row, rowIndex) =>
        row.map((isDark, columnIndex) =>
          isDark ? <rect key={`${rowIndex}-${columnIndex}`} x={columnIndex} y={rowIndex} width="1" height="1" fill="black" /> : null,
        ),
      )}
    </svg>
  );
}

export function PixKeyDonationCard({ churchId, churchName, slug, pixKey }: PixKeyDonationCardProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const qrResult = useMemo(() => {
    try {
      return { matrix: createPixQrMatrix(pixKey), error: false };
    } catch {
      return { matrix: null, error: true };
    }
  }, [pixKey]);
  const matrix = qrResult.matrix;

  const handleCopy = async () => {
    try {
      setCopyError(false);
      await copyText(pixKey);
      setCopied(true);
      void trackPublicEvent({
        churchId,
        eventType: "PUBLIC_CHURCH_CONTACT_CLICK",
        source: "WEB_DETAIL",
        path: `/comunidades/${slug}`,
        metadata: { channel: "pix-key-copy" },
      });
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopyError(true);
    }
  };

  return (
    <section
      aria-labelledby="pix-donation-title"
      className="mt-5 rounded-[1.5rem] border border-emerald-400/15 bg-emerald-500/[0.06] p-5"
    >
      <div className="flex items-center gap-2">
        <HeartHandshake className="h-4 w-4 text-emerald-300" aria-hidden="true" />
        <h3 id="pix-donation-title" className="text-sm font-semibold text-emerald-100">
          Contribua por PIX
        </h3>
      </div>
      <p className="mt-3 text-sm leading-6 text-zinc-300">
        QR da chave PIX configurada por {churchName}. Escaneie com o app do seu banco ou copie a chave abaixo.
      </p>

      {matrix ? (
        <div className="mx-auto mt-5 w-full max-w-[232px] rounded-2xl bg-white p-4 shadow-sm">
          <PixQrSvg matrix={matrix} label={`QR da chave PIX de ${churchName}`} />
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-amber-300/20 bg-amber-400/10 p-3 text-xs leading-5 text-amber-100">
          Não foi possível gerar o QR localmente agora. A chave continua disponível para cópia.
        </p>
      )}

      <div className="mt-5 rounded-xl border border-white/10 bg-zinc-950/50 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Chave PIX</p>
        <code className="mt-2 block break-all text-sm leading-6 text-zinc-200">{pixKey}</code>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/70"
        >
          {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          {copied ? "Chave copiada" : "Copiar chave PIX"}
        </button>
        {copyError ? <p className="mt-2 text-xs text-amber-200">Não foi possível copiar automaticamente. Selecione a chave manualmente.</p> : null}
      </div>

      <p className="mt-4 text-xs leading-5 text-zinc-500">
        O EclessGO apenas exibe a chave PIX. Não processamos o pagamento, emitimos recibo nem confirmamos a transferência.
      </p>
      {qrResult.error ? <span className="sr-only">Erro ao gerar o QR local da chave PIX.</span> : null}
    </section>
  );
}
