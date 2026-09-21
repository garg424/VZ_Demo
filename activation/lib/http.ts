import { NextResponse } from "next/server";

export type Envelope<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; message: string };

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function fail(error: string, message: string, status: number) {
  return NextResponse.json({ ok: false, error, message }, { status });
}

// Thrown anywhere in a handler; caught by `handle` and turned into an envelope.
export class ApiError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ApiError) return fail(e.code, e.message, e.status);
    console.error(e);
    return fail(
      "INTERNAL",
      e instanceof Error ? e.message : "Unexpected error",
      500
    );
  }
}
