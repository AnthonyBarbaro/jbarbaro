"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";

type SubmissionState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

type NewsletterSignupProps = {
  source: string;
  inverted?: boolean;
};

export function NewsletterSignup({ source, inverted = false }: NewsletterSignupProps) {
  const [submission, setSubmission] = useState<SubmissionState>({ status: "idle" });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") || "");
    const website = String(formData.get("website") || "");

    setSubmission({ status: "loading" });

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, source, website }),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "Unable to join the list.");
      }

      setSubmission({
        status: "success",
        message: payload.message || "You're on the list.",
      });
      form.reset();
    } catch (error) {
      setSubmission({
        status: "error",
        message: error instanceof Error ? error.message : "Unable to join the list.",
      });
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="hidden" aria-hidden>
        <label htmlFor={`${source}-newsletter-website`}>Website</label>
        <input id={`${source}-newsletter-website`} name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor={`${source}-newsletter-email`}>
          Email address
        </label>
        <input
          id={`${source}-newsletter-email`}
          name="email"
          type="email"
          required
          placeholder="Email address"
          className={`min-h-11 flex-1 rounded-full border px-4 text-sm outline-none focus:ring-4 ${
            inverted
              ? "border-ivory/20 bg-ivory/10 text-ivory placeholder:text-ivory/55 focus:ring-gold/20"
              : "border-ink/12 bg-white text-ink placeholder:text-smoke focus:ring-deep-teal/18"
          }`}
        />
        <Button type="submit" size="sm" disabled={submission.status === "loading"} className="shrink-0">
          {submission.status === "loading" ? "Joining..." : "Join"}
        </Button>
      </div>
      {submission.status === "success" ? (
        <p className={inverted ? "text-sm text-gold" : "text-sm text-deep-teal"}>{submission.message}</p>
      ) : null}
      {submission.status === "error" ? <p className="text-sm text-[color:#b91c1c]">{submission.message}</p> : null}
    </form>
  );
}
