"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { FieldLabel, Input, Textarea } from "@/components/ui/Field";

type SubmissionState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function ContactForm() {
  const [submission, setSubmission] = useState<SubmissionState>({ status: "idle" });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setSubmission({ status: "loading" });

    try {
      const payload = {
        name: String(formData.get("name") || ""),
        email: String(formData.get("email") || ""),
        phone: String(formData.get("phone") || ""),
        message: String(formData.get("message") || ""),
        website: String(formData.get("website") || ""),
      };

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responsePayload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(responsePayload.message || "Unable to send message.");
      }

      setSubmission({
        status: "success",
        message: "Thanks for contacting us. Our team will follow up shortly.",
      });
      form.reset();
    } catch (error) {
      setSubmission({
        status: "error",
        message: error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="contact-name">Name</FieldLabel>
            <Input id="contact-name" name="name" required />
          </div>

          <div>
            <FieldLabel htmlFor="contact-email">Email</FieldLabel>
            <Input id="contact-email" type="email" name="email" required />
          </div>

          <div>
            <FieldLabel htmlFor="contact-phone">Phone</FieldLabel>
            <Input id="contact-phone" type="tel" name="phone" />
          </div>

          <div className="hidden" aria-hidden>
            <label htmlFor="contact-website">Website</label>
            <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
          </div>

          <div className="sm:col-span-2">
            <FieldLabel htmlFor="contact-message">Message</FieldLabel>
            <Textarea id="contact-message" name="message" required rows={5} placeholder="How can we help you?" />
          </div>

          <div className="sm:col-span-2">
            <Button type="submit" disabled={submission.status === "loading"} className="w-full sm:w-auto">
              {submission.status === "loading" ? "Sending..." : "Send Message"}
            </Button>

            {submission.status === "success" ? (
              <p className="mt-3 text-sm text-deep-teal">{submission.message}</p>
            ) : null}
            {submission.status === "error" ? <p className="mt-3 text-sm text-red-700">{submission.message}</p> : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
