import { NextResponse } from "next/server";

import { formJson } from "@/lib/form-request";

export async function POST(): Promise<NextResponse> {
  return formJson(
    {
      received: false,
      retryAllowed: false,
      message: "Newsletter signup is currently unavailable. Please check back later.",
    },
    503,
  );
}
