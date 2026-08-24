import { toQR } from "toqr";

function utf8Length(value: string) {
  return new TextEncoder().encode(value).length;
}

function field(id: string, value: string) {
  const length = utf8Length(value);
  if (length > 99) throw new RangeError(`Campo PIX ${id} excede 99 bytes.`);
  return `${id}${String(length).padStart(2, "0")}${value}`;
}

function crc16Ccitt(value: string) {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(value)) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) !== 0 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Creates a local static PIX payload from the configured key. Existing BR
 * Code copy-and-paste values are preserved; no gateway or network is used.
 */
export function buildPixQrPayload(pixKey: string) {
  const normalized = pixKey.trim();
  if (!normalized) throw new Error("A chave PIX é obrigatória.");
  if (normalized.startsWith("000201")) return normalized;

  const merchantAccount = field(
    "26",
    `${field("00", "BR.GOV.BCB.PIX")}${field("01", normalized)}`,
  );
  const body = [
    field("00", "01"),
    merchantAccount,
    field("52", "0000"),
    field("53", "986"),
    field("58", "BR"),
    field("59", "ECLESSGO"),
    field("60", "BRASIL"),
    field("62", field("05", "***")),
  ].join("");
  const crcInput = `${body}6304`;
  return `${crcInput}${crc16Ccitt(crcInput)}`;
}

export interface PixQrMatrix {
  size: number;
  modules: boolean[][];
  payload: string;
}

export function createPixQrMatrix(pixKey: string): PixQrMatrix {
  const payload = buildPixQrPayload(pixKey);
  const encoded = toQR(payload);
  const size = Math.sqrt(encoded.length);
  if (!Number.isInteger(size)) throw new Error("Não foi possível gerar o QR da chave PIX.");

  return {
    size,
    modules: Array.from({ length: size }, (_, row) =>
      Array.from({ length: size }, (_, column) => encoded[row * size + column] === 1),
    ),
    payload,
  };
}
