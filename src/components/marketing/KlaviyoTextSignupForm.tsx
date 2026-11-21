"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

import { applyKlaviyoTrackingPreference } from "@/lib/cookie-preference";
import { KLAVIYO_TEXT_SIGNUP_FORM_ID } from "@/lib/klaviyo";

type FormStatus = "loading" | "ready" | "unavailable";
type SubmissionStatus = "idle" | "submitting" | "delayed";

export function KlaviyoTextSignupForm({
  siteId,
  fallbackHref,
}: {
  siteId: string;
  fallbackHref?: string;
}) {
  const formRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<FormStatus>("loading");
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>("idle");
  const [canLoadScript, setCanLoadScript] = useState(false);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    applyKlaviyoTrackingPreference();
    const loadTimeout = window.setTimeout(() => setStatus("unavailable"), 8000);
    let submissionTimeout: number | undefined;

    const checkForm = () => {
      if (form.querySelector("input, select, textarea, button")) {
        window.clearTimeout(loadTimeout);
        setStatus("ready");
      }

      // Klaviyo disables its submit button while the signup request is pending.
      if (form.querySelector("button.klaviyo-form-button:disabled")) {
        if (submissionTimeout === undefined) {
          setSubmissionStatus("submitting");
          submissionTimeout = window.setTimeout(() => setSubmissionStatus("delayed"), 8000);
        }
      } else if (submissionTimeout !== undefined) {
        window.clearTimeout(submissionTimeout);
        submissionTimeout = undefined;
        setSubmissionStatus("idle");
      }
    };

    const observer = new MutationObserver(checkForm);
    observer.observe(form, { childList: true, subtree: true, attributeFilter: ["disabled"] });
    const frame = window.requestAnimationFrame(() => {
      checkForm();
      setCanLoadScript(true);
    });

    return () => {
      observer.disconnect();
      window.clearTimeout(loadTimeout);
      window.clearTimeout(submissionTimeout);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div>
      {canLoadScript ? (
        <Script
          id="klaviyo-onsite"
          src={`https://static.klaviyo.com/onsite/js/${siteId}/klaviyo.js`}
          strategy="afterInteractive"
          onError={() => setStatus("unavailable")}
        />
      ) : null}
      <div ref={formRef} className={`klaviyo-form-${KLAVIYO_TEXT_SIGNUP_FORM_ID}`} />
      <div role="status" className="text-center text-sm leading-6 text-ink">
        {submissionStatus !== "idle" ? (
          <p className="px-5 pb-4">
            {submissionStatus === "submitting"
              ? "Submitting your signup…"
              : "Signup is taking longer than usual. Check your texts for a confirmation before trying again."}
          </p>
        ) : null}
      </div>
      {submissionStatus === "delayed" && fallbackHref ? (
        <a
          href={fallbackHref}
          className="block px-5 pb-4 text-center text-sm text-deep-teal underline underline-offset-4"
        >
          Open the signup page
        </a>
      ) : null}
      {status !== "ready" ? (
        <div className="klaviyo-form-status flex min-h-36 flex-col items-center justify-center gap-2 p-6 text-center text-sm leading-6">
          <p role="status">
            {status === "loading"
              ? "Loading text signup…"
              : "Text signup couldn’t load. Please try again."}
          </p>
          {status === "unavailable" && fallbackHref ? (
            <a href={fallbackHref} className="text-deep-teal underline underline-offset-4">
              Open the signup page
            </a>
          ) : null}
        </div>
      ) : null}
      <noscript>
        <style>{".klaviyo-form-status { display: none; }"}</style>
        <p className="p-5 text-sm leading-7 text-smoke">Enable JavaScript to sign up for texts.</p>
      </noscript>
    </div>
  );
}
