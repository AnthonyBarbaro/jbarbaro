"use client";

import { useEmailSubmission } from "@/components/forms/useEmailSubmission";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { FieldLabel, Input, Select, Textarea } from "@/components/ui/Field";
import type { Location } from "@/types/site";

type WeddingRegistrationFormProps = {
  locations: Location[];
};

export function WeddingRegistrationForm({ locations }: WeddingRegistrationFormProps) {
  const { submission, blocked, feedbackRef, submit } = useEmailSubmission(
    "/api/wedding-registration",
  );
  const loading = submission.status === "loading";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    await submit(form, {
      groomName: String(formData.get("groomName") || ""),
      brideName: String(formData.get("brideName") || ""),
      phone: String(formData.get("phone") || ""),
      email: String(formData.get("email") || ""),
      weddingDate: String(formData.get("weddingDate") || ""),
      numberGroomsmen: Number(formData.get("numberGroomsmen") || 0),
      locationSlug: String(formData.get("locationSlug") || ""),
      notes: String(formData.get("notes") || ""),
      website: String(formData.get("website") || ""),
    });
  }

  return (
    <Card className="min-w-0 wrap-anywhere">
      <CardContent className="p-[20px] sm:p-6 lg:p-7">
        <form
          onSubmit={onSubmit}
          aria-busy={loading}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <div>
            <FieldLabel htmlFor="groomName">Groom&apos;s Full Name</FieldLabel>
            <Input
              id="groomName"
              name="groomName"
              autoComplete="name"
              minLength={2}
              maxLength={120}
              disabled={loading}
              required
            />
          </div>

          <div>
            <FieldLabel htmlFor="brideName">Bride&apos;s Full Name</FieldLabel>
            <Input
              id="brideName"
              name="brideName"
              minLength={2}
              maxLength={120}
              disabled={loading}
              required
            />
          </div>

          <div>
            <FieldLabel htmlFor="phone">Phone</FieldLabel>
            <Input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              minLength={7}
              maxLength={30}
              disabled={loading}
              required
            />
          </div>

          <div>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              disabled={loading}
              required
            />
          </div>

          <div>
            <FieldLabel htmlFor="weddingDate">Wedding Date</FieldLabel>
            <Input id="weddingDate" name="weddingDate" type="date" disabled={loading} required />
          </div>

          <div>
            <FieldLabel htmlFor="numberGroomsmen">Approximate Number of Groomsmen</FieldLabel>
            <Input
              id="numberGroomsmen"
              name="numberGroomsmen"
              type="number"
              min={1}
              max={50}
              disabled={loading}
              required
            />
          </div>

          <div className="sm:col-span-2">
            <FieldLabel htmlFor="locationSlug">Preferred Showroom</FieldLabel>
            <Select id="locationSlug" name="locationSlug" defaultValue="" disabled={loading}>
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
            <input
              id="wedding-website"
              name="website"
              maxLength={200}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className="sm:col-span-2">
            <FieldLabel htmlFor="notes">Notes (Optional)</FieldLabel>
            <Textarea
              id="notes"
              name="notes"
              rows={4}
              maxLength={2000}
              disabled={loading}
              placeholder="Tell us about your wedding style, preferred colors, timeline, and rental/purchase goals."
            />
          </div>

          <div className="sm:col-span-2">
            <Button type="submit" disabled={blocked} className="w-full sm:w-auto">
              {loading
                ? "Submitting..."
                : submission.status === "success"
                  ? "Registration Received"
                  : "Register Wedding Party"}
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
