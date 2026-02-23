import { NextRequest } from "next/server";

export function isContentLengthTooLarge(
  request: NextRequest,
  maxBytes: number
) {
  const header = request.headers.get("content-length");
  if (!header) return false;
  const length = Number(header);
  if (!Number.isFinite(length)) return false;
  return length > maxBytes;
}
