import { NextResponse } from "next/server";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export function notImplemented(feature: string) {
  return NextResponse.json(
    { error: "Not implemented", feature, phase: 2 },
    { status: 501 }
  );
}
