import { NextResponse } from "next/server";
import { getPayload } from "payload";

import config from "@/payload.config";
import { runCmsBootstrap } from "@/payload/seed";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const seedSecret = process.env.CMS_SEED_SECRET;

  if (!seedSecret) {
    return NextResponse.json(
      {
        error: "CMS_SEED_SECRET is not configured.",
      },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const providedSecret = request.headers.get("x-cms-seed-secret") || url.searchParams.get("secret");

  if (providedSecret !== seedSecret) {
    return NextResponse.json(
      {
        error: "Unauthorized.",
      },
      { status: 401 },
    );
  }

  let force = false;

  try {
    if (request.headers.get("content-type")?.includes("application/json")) {
      const body = (await request.json()) as { force?: boolean };
      force = Boolean(body.force);
    }
  } catch {
    return NextResponse.json(
      {
        error: "Invalid JSON body.",
      },
      { status: 400 },
    );
  }

  const payload = await getPayload({ config });
  const result = await runCmsBootstrap(payload, {
    mode: force ? "force" : "if-empty",
  });

  return NextResponse.json(result);
}
