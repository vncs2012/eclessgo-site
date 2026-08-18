import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api-route-error";
import { uploadRegisterChurchImage } from "@/lib/public-api";
import {
  PublicPayloadTooLargeError,
  readFormDataWithLimit,
} from "@/lib/request-body-limit";
import { getPublicRequestId, getPublicTraceHeaders, withPublicRequestId } from "@/lib/public-bff";
import { publicUploadMimeTypes, publicUploadPurposeSchema } from "@/lib/public-bff-schemas";

export async function POST(request: Request) {
  const requestId = getPublicRequestId(request);

  try {
    const formData = await readFormDataWithLimit(request, 5 * 1024 * 1024);
    const purpose = formData.get("purpose");
    const file = formData.get("file");

    const parsedPurpose = publicUploadPurposeSchema.safeParse(purpose);
    if (!parsedPurpose.success) {
      return withPublicRequestId(NextResponse.json(
        {
          statusCode: 400,
          error: "BadRequest",
          message: "Tipo de imagem invalido. Use logo ou cover.",
        },
        { status: 400 },
      ), requestId);
    }

    if (!(file instanceof File)) {
      return withPublicRequestId(NextResponse.json(
        {
          statusCode: 400,
          error: "BadRequest",
          message: "Envie uma imagem PNG, JPG ou WebP.",
        },
        { status: 400 },
      ), requestId);
    }

    if (!publicUploadMimeTypes.has(file.type) || file.size === 0) {
      return withPublicRequestId(NextResponse.json(
        {
          statusCode: 422,
          error: "ValidationError",
          message: "Envie uma imagem JPEG, PNG ou WebP valida.",
        },
        { status: 422 },
      ), requestId);
    }

    const data = await uploadRegisterChurchImage(
      { file, purpose: parsedPurpose.data },
      { requestId, traceHeaders: getPublicTraceHeaders(request) },
    );
    return withPublicRequestId(NextResponse.json({ data }, { status: 201 }), requestId);
  } catch (error) {
    if (error instanceof PublicPayloadTooLargeError) {
      return withPublicRequestId(NextResponse.json(
        { statusCode: 413, error: "PayloadTooLarge", message: error.message },
        { status: 413, headers: { "Retry-After": "60" } },
      ), requestId);
    }
    return apiErrorResponse(error, "Nao foi possivel enviar a imagem da comunidade.", requestId);
  }
}
