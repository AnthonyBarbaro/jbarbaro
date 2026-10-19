"use client";

import { useEmailSubmission } from "@/components/forms/useEmailSubmission";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { FieldLabel, Input, Textarea } from "@/components/ui/Field";

export function ContactForm() {
  const { submission, blocked, feedbackRef, submit } = useEmailSubmission("/api/contact");
  const loading = submission.status === "loading";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    await submit(form, {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || ""),
      message: String(formData.get("message") || ""),
      website: String(formData.get("website") || ""),
    });
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={onSubmit} aria-busy={loading} className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="contact-name">Name</FieldLabel>
            <Input
              id="contact-name"
              name="name"
              autoComplete="name"
              minLength={2}
              maxLength={120}
              disabled={loading}
              required
            />
          </div>

          <div>
            <FieldLabel htmlFor="contact-email">Email</FieldLabel>
            <Input
              id="contact-email"
              type="email"
              name="email"
              autoComplete="email"
              maxLength={254}
              disabled={loading}
              required
            />
          </div>

          <div>
            <FieldLabel htmlFor="contact-phone">Phone</FieldLabel>
            <Input
              id="contact-phone"
              type="tel"
              name="phone"
              autoComplete="tel"
              maxLength={30}
              disabled={loading}
            />
          </div>

          <div className="hidden" aria-hidden>
            <label htmlFor="contact-website">Website</label>
            <input
              id="contact-website"
              name="website"
              maxLength={200}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className="sm:col-span-2">
            <FieldLabel htmlFor="contact-message">Message</FieldLabel>
            <Textarea
              id="contact-message"
              name="message"
              minLength={8}
              maxLength={2000}
              disabled={loading}
              required
              rows={5}
              placeholder="How can we help you?"
            />
          </div>

          <div className="sm:col-span-2">
            <Button type="submit" disabled={blocked} className="w-full sm:w-auto">
              {loading
                ? "Sending..."
                : submission.status === "success"
                  ? "Message Received"
                  : "Send Message"}
            </Button>

            {submission.status === "success" || submission.status === "error" ? (
              <p
                ref={feedbackRef}
                role={submission.status === "error" ? "alert" : "status"}
                tabIndex={-1}
                className="mt-3 text-sm text-ink"
              >
                {submission.message}
              </p>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
