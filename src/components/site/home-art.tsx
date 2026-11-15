import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

/** Degradês de foto já definidos como token (--eg-photo-N). */
const PHOTOS = {
  1: "var(--eg-photo-1)",
  2: "var(--eg-photo-2)",
  3: "var(--eg-photo-3)",
  4: "var(--eg-photo-4)",
} as const;

/** Sol e silhuetas de pessoas sobre o degradê (a mesma ilustração dos protótipos). */
const SILHOUETTES: CSSProperties["backgroundImage"] = [
  "radial-gradient(circle at 74% 30%, rgb(255 255 255 / .38) 0 13%, transparent 13.5%)",
  "radial-gradient(ellipse 13% 40% at 22% 100%, rgb(255 255 255 / .22) 0 99%, transparent 100%)",
  "radial-gradient(ellipse 16% 52% at 50% 100%, rgb(255 255 255 / .22) 0 99%, transparent 100%)",
  "radial-gradient(ellipse 11% 32% at 84% 100%, rgb(255 255 255 / .22) 0 99%, transparent 100%)",
].join(", ");

type HomeArtProps = {
  photo: keyof typeof PHOTOS;
  className?: string;
};

/**
 * Imagem ilustrativa da Home enquanto não há foto real: degradê de token + silhuetas.
 * Decorativa (aria-hidden): o texto ao lado diz tudo.
 */
export function HomeArt({ photo, className }: HomeArtProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("relative overflow-hidden", className)}
      style={{ background: PHOTOS[photo] }}
    >
      <div className="absolute inset-0" style={{ backgroundImage: SILHOUETTES }} />
    </div>
  );
}
