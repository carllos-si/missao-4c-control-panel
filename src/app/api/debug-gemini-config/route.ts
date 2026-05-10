import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const key = process.env.GEMINI_API_KEY?.trim() ?? "";
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";

  const maskedKey =
    key.length >= 10
      ? `${key.slice(0, 6)}...${key.slice(-4)}`
      : key
      ? "***"
      : null;

  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    model,
    keyPresent: Boolean(key),
    keyLength: key.length || 0,
    keyPreview: maskedKey,
  });
}
