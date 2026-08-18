export class PublicPayloadTooLargeError extends Error {
  statusCode = 413;

  constructor(message = "O payload excede o limite permitido.") {
    super(message);
    this.name = "PublicPayloadTooLargeError";
  }
}

export async function readRequestBodyWithLimit(
  request: Request,
  maxBytes: number,
): Promise<Uint8Array> {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > maxBytes) {
    throw new PublicPayloadTooLargeError();
  }

  if (!request.body) return new Uint8Array();

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw new PublicPayloadTooLargeError();
    }
    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

export async function readJsonBodyWithLimit<T>(request: Request, maxBytes: number): Promise<T> {
  const body = await readRequestBodyWithLimit(request, maxBytes);
  return JSON.parse(new TextDecoder().decode(body)) as T;
}

export async function readFormDataWithLimit(request: Request, maxBytes: number): Promise<FormData> {
  const body = await readRequestBodyWithLimit(request, maxBytes);
  const replayableRequest = new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body: body as unknown as BodyInit,
  });
  return replayableRequest.formData();
}
