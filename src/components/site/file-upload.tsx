"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Image from "next/image";
import { ImageUp, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

type FileUploadProps = {
  label: string;
  description: string;
  value: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  maxSizeMb?: number;
  recommendedSize?: string;
};

export function FileUpload({
  label,
  description,
  value,
  onChange,
  accept = "image/png,image/jpeg,image/webp",
  maxSizeMb = 4,
  recommendedSize,
}: FileUploadProps) {
  const t = useTranslations("fileUpload");
  const inputId = useId();
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const previewUrl = useMemo(() => (value ? URL.createObjectURL(value) : null), [value]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function selectFile(file: File | null) {
    setError(null);
    if (!file) {
      onChange(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError(t("invalidType"));
      return;
    }

    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(t("tooLarge", { max: maxSizeMb }));
      return;
    }

    onChange(file);
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-zinc-100">{label}</p>
        <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p>
      </div>

      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          selectFile(event.dataTransfer.files.item(0));
        }}
        className={[
          "flex min-h-52 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[1.5rem] border border-dashed p-4 text-center transition",
          isDragging ? "border-emerald-300 bg-emerald-400/10" : "border-white/12 bg-zinc-950/55 hover:border-emerald-400/35",
        ].join(" ")}
      >
        <input
          id={inputId}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(event) => selectFile(event.target.files?.item(0) ?? null)}
        />

        {previewUrl ? (
          <Image
            src={previewUrl}
            alt={t("previewAlt", { label: label.toLowerCase() })}
            width={640}
            height={360}
            unoptimized
            className="h-44 w-full rounded-[1.25rem] object-cover"
          />
        ) : (
          <span className="flex flex-col items-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/12 text-emerald-200">
              <ImageUp className="h-5 w-5" />
            </span>
            <span className="mt-3 text-sm font-medium text-zinc-200">{t("prompt")}</span>
            <span className="mt-1 text-xs text-zinc-500">
              {recommendedSize ? `${recommendedSize} · ` : ""}
              {t("hint", { max: maxSizeMb })}
            </span>
          </span>
        )}
      </label>

      <div className="flex min-h-6 items-center justify-between gap-3 text-xs">
        <p className={error ? "text-red-300" : "text-zinc-500"} aria-live="polite">
          {error || (value ? value.name : t("empty"))}
        </p>
        {value ? (
          <button
            type="button"
            onClick={() => selectFile(null)}
            className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 font-medium text-zinc-300 transition hover:border-red-400/40 hover:text-red-200"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t("remove")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
