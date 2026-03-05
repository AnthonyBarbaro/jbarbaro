"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { FieldLabel, Input, Select, Textarea } from "@/components/ui/Field";
import type { Location } from "@/types/site";

type WeddingRegistrationFormProps = {
  locations: Location[];
};

type SubmissionState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function WeddingRegistrationForm({ locations }: WeddingRegistrationFormProps) {
  const [submission, setSubmission] = useState<SubmissionState>({ status: "idle" });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setSubmission({ status: "loading" });

    try {
      const payload = {
        groomName: String(formData.get("groomName") || ""),
        brideName: String(formData.get("brideName") || ""),
        phone: String(formData.get("phone") || ""),
        email: String(formData.get("email") || ""),
        weddingDate: String(formData.get("weddingDate") || ""),
        numberGroomsmen: Number(formData.get("numberGroomsmen") || 0),
        locationSlug: String(formData.get("locationSlug") || ""),
        notes: String(formData.get("notes") || ""),
        website: String(formData.get("website") || ""),
      };

      const response = await fetch("/api/wedding-registration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responsePayload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(responsePayload.message || "Unable to submit wedding registration.");
      }

      setSubmission({
        status: "success",
        message: responsePayload.message || "Wedding registration submitted successfully.",
      });
      form.reset();
    } catch (error) {
      setSubmission({
        status: "error",
        message: error instanceof Error ? error.message : "Unable to submit wedding registration.",
      });
    }
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="groomName">Groom&apos;s Full Name</FieldLabel>
            <Input id="groomName" name="groomName" required />
          </div>

          <div>
            <FieldLabel htmlFor="brideName">Bride&apos;s Full Name</FieldLabel>
            <Input id="brideName" name="brideName" required />
          </div>

          <div>
            <FieldLabel htmlFor="phone">Phone</FieldLabel>
            <Input id="phone" name="phone" type="tel" required />
          </div>

          <div>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" name="email" type="email" required />
          </div>

          <div>
            <FieldLabel htmlFor="weddingDate">Wedding Date</FieldLabel>
            <Input id="weddingDate" name="weddingDate" type="date" required />
          </div>

          <div>
            <FieldLabel htmlFor="numberGroomsmen">Approximate Number of Groomsmen</FieldLabel>
            <Input id="numberGroomsmen" name="numberGroomsmen" type="number" min={1} required />
          </div>

          <div className="sm:col-span-2">
            <FieldLabel htmlFor="locationSlug">Preferred Showroom</FieldLabel>
            <Select id="locationSlug" name="locationSlug" defaultValue="">
              <option value="">No preference</option>
              {locations.map((location) => (
                <option key={location.slug} value={location.slug}>
                  {location.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="hidden" aria-hidden>
            <label htmlFor="wedding-website">Website</label>
            <input id="wedding-website" name="website" tabIndex={-1} autoComplete="off" />
          </div>

          <div className="sm:col-span-2">
            <FieldLabel htmlFor="notes">Notes (Optional)</FieldLabel>
            <Textarea
              id="notes"
              name="notes"
              rows={4}
              placeholder="Tell us about your wedding style, preferred colors, timeline, and rental/purchase goals."
            />
          </div>

          <div className="sm:col-span-2">
            <Button type="submit" disabled={submission.status === "loading"} className="w-full sm:w-auto">
              {submission.status === "loading" ? "Submitting..." : "Register Wedding Party"}
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
