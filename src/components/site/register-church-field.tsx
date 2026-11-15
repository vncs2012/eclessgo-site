import { type ReactNode } from "react";

type FieldProps = {
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
};

export function Field({ label, error, className, children }: FieldProps) {
  return (
    <label className={className}>
      <span className="mb-2 block text-sm font-medium text-eg-text">{label}</span>
      {children}
      {error ? <span className="mt-2 block text-xs text-eg-danger-text">{error}</span> : null}
    </label>
  );
}
