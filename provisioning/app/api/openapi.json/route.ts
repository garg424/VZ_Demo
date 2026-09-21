import { NextResponse } from "next/server";
import { openapi } from "@/lib/openapi";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(openapi);
}
