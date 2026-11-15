import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Campo de texto/seleção do cadastro (Modelo 8). Sem `text-*`/`font-*`: `font: inherit` dos
 * controles fica fora de @layer em globals.css e anularia essas classes; o tamanho vem do pai.
 * O foco visível é o de `.input-surface:focus-visible` (contorno sólido de 2 px).
 */
export const REGISTER_INPUT_CLASS = "input-surface h-11 w-full rounded-[9px] px-3.5 md:h-10";
export const REGISTER_TEXTAREA_CLASS = "input-surface min-h-24 w-full rounded-[9px] px-3.5 py-2.5";

/** Contorno sólido de 2 px (nunca `outline-none`/`outline-hidden`: no Tailwind 4 anulam o contorno). */
export const REGISTER_FOCUS =
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-eg-focus";

type FieldProps = {
  label: string;
  error?: string;
  className?: string;
  /** Asterisco visual; o campo obrigatório também leva `aria-required` no controle. */
  required?: boolean;
  /** "(opcional)" ao lado do rótulo. */
  optionalLabel?: string;
  hint?: string;
  /** Um único controle (input, select ou textarea): recebe `id`, `aria-describedby` e `aria-invalid`. */
  children: ReactNode;
};

export function Field({ label, error, className, required, optionalLabel, hint, children }: FieldProps) {
  const id = useId();
  const messageId = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const control = isValidElement<Record<string, unknown>>(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        id,
        "aria-describedby": messageId,
        "aria-invalid": error ? true : undefined,
      })
    : children;

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={cn(
          "mb-1.5 block text-[13px] font-bold text-eg-strong",
          // Asterisco só visual (pseudo-elemento, com texto alternativo vazio onde há suporte):
          // fica fora do texto do rótulo; `aria-required` no controle avisa os leitores de tela.
          required && "after:ml-1 after:text-eg-danger-text after:content-['*'] after:[content:'*'_/_'']",
        )}
      >
        {label}
        {optionalLabel ? (
          <span className="ml-1.5 text-xs font-normal text-eg-muted">({optionalLabel})</span>
        ) : null}
      </label>
      {control}
      {hint && !error ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs leading-5 text-eg-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-medium leading-5 text-eg-danger-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}
