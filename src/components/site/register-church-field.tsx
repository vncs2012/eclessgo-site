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
      <span className="mb-2 block text-sm font-medium text-zinc-300">{label}</span>
      {children}
      {error ? <span className="mt-2 block text-xs text-red-300">{error}</span> : null}
    </label>
  );
}
