import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import type { SubmissionEmailResult } from "@/lib/email";

export const MAX_FORM_BODY_BYTES = 12_000;

export function formJson(body: object, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export function invalidForm(message: string, status = 400): NextResponse {
  return formJson({ received: false, retryAllowed: true, message }, status);
}

export async function readFormJson(
  request: Request,
): Promise<{ ok: true; value: unknown } | { ok: false; response: NextResponse }> {
  const tooLarge = (): { ok: false; response: NextResponse } => ({
    ok: false,
    response: invalidForm("Your submission is too large. Please shorten it and try again.", 413),
  });
  if (Number(request.headers.get("content-length")) > MAX_FORM_BODY_BYTES) return tooLarge();
  const reader = request.body?.getReader();
  if (!reader) return { ok: false, response: invalidForm("Invalid form data.") };

  try {
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_FORM_BODY_BYTES) {
        // A closed connection can reject cancellation; it does not change the size rejection.
        await reader.cancel().catch(() => undefined);
        return tooLarge();
      }
      chunks.push(value);
    }
    const text = new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks));
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, response: invalidForm("Invalid form data. Please check your details.") };
  } finally {
    reader.releaseLock();
  }
}

export function formRequestIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 100) || "unknown";
}

export function formReference(prefix: "CTC" | "WDG", requestId: string): string {
  return `${prefix}-${createHash("sha256").update(requestId.toLowerCase()).digest("hex").slice(0, 16).toUpperCase()}`;
}

export function submissionEmailResponse(
  delivery: SubmissionEmailResult,
  reference: string,
  kind: "message" | "wedding registration",
): NextResponse {
  if (delivery.internal !== "SENT") {
    const retryAllowed = delivery.internal === "FAILED";
    return formJson(
      {
        received: false,
        reference,
        retryAllowed,
        message: retryAllowed
          ? `Your ${kind} was not sent. Please try again or call the showroom. Reference ${reference}.`
          : `We could not confirm receipt of your ${kind}. Call the showroom and quote ${reference} before submitting again.`,
      },
      503,
    );
  }
  return formJson({
    received: true,
    reference,
    retryAllowed: false,
    message: `Your ${kind} was received. Our team will follow up.${delivery.customer === "SENT" ? " A confirmation email has been sent." : ""} Reference ${reference}.`,
  });
}
