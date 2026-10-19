"use client";

import { useEffect, useRef, useState } from "react";

import {
  readSubmissionResponse,
  uncertainSubmission,
  type FormSubmissionResult,
} from "@/lib/form-submission";

type SubmissionState = { status: "idle" } | { status: "loading" } | FormSubmissionResult;

export function useEmailSubmission(endpoint: string): {
  submission: SubmissionState;
  blocked: boolean;
  feedbackRef: React.RefObject<HTMLParagraphElement | null>;
  submit: (form: HTMLFormElement, fields: Record<string, string | number>) => Promise<void>;
} {
  const [submission, setSubmission] = useState<SubmissionState>({ status: "idle" });
  const inFlight = useRef(false);
  const attempt = useRef<{ id: string; fields: string; reference?: string } | null>(null);
  const feedbackRef = useRef<HTMLParagraphElement>(null);
  const blocked =
    submission.status === "loading" ||
    submission.status === "success" ||
    (submission.status === "error" && !submission.retryAllowed);

  useEffect(() => {
    if (submission.status === "success" || submission.status === "error")
      feedbackRef.current?.focus();
  }, [submission]);

  async function submit(
    form: HTMLFormElement,
    fields: Record<string, string | number>,
  ): Promise<void> {
    if (inFlight.current || blocked) return;
    inFlight.current = true;
    setSubmission({ status: "loading" });
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 90_000);
    try {
      const serializedFields = JSON.stringify(fields);
      if (attempt.current?.fields !== serializedFields) {
        attempt.current = { id: crypto.randomUUID(), fields: serializedFields };
      }
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, requestId: attempt.current.id }),
        signal: controller.signal,
      });
      const result = await readSubmissionResponse(response);
      if (result.reference) attempt.current.reference = result.reference;
      setSubmission(result);
      if (result.status === "success") form.reset();
    } catch {
      setSubmission(uncertainSubmission(attempt.current?.reference));
    } finally {
      window.clearTimeout(timeout);
      inFlight.current = false;
    }
  }

  return { submission, blocked, feedbackRef, submit };
}
