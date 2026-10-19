export type FormSubmissionResult =
  | { status: "success"; message: string; reference: string }
  | { status: "error"; message: string; retryAllowed: boolean; reference?: string };

export function uncertainSubmission(reference?: string): FormSubmissionResult {
  return {
    status: "error",
    retryAllowed: false,
    reference,
    message: `We could not confirm receipt. Please call the showroom${reference ? ` and quote ${reference}` : ""} before submitting again.`,
  };
}

export async function readSubmissionResponse(response: Response): Promise<FormSubmissionResult> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return uncertainSubmission();
  }
  if (typeof payload !== "object" || payload === null) return uncertainSubmission();
  const reference =
    "reference" in payload &&
    typeof payload.reference === "string" &&
    /^(CTC|WDG)-[A-F0-9]{16}$/.test(payload.reference)
      ? payload.reference
      : undefined;
  const message =
    "message" in payload && typeof payload.message === "string" && payload.message.trim()
      ? payload.message
      : undefined;

  if (response.ok) {
    if (!("received" in payload) || payload.received !== true || !reference || !message) {
      return uncertainSubmission(reference);
    }
    return { status: "success", message, reference };
  }
  const retryAllowed =
    "received" in payload &&
    payload.received === false &&
    "retryAllowed" in payload &&
    payload.retryAllowed === true &&
    [400, 413, 422, 429, 503].includes(response.status);
  return {
    status: "error",
    retryAllowed,
    reference,
    message:
      message ||
      (retryAllowed
        ? "Your submission was not sent. Please check your details and try again."
        : uncertainSubmission(reference).message),
  };
}
