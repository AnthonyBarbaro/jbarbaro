export type AppointmentSubmissionPayload = {
  reference: string;
  submittedAt: Date;
  locationSlug: string;
  serviceType: string;
  preferredDate: Date;
  preferredTimeWindow: string;
  name: string;
  email: string;
  phone: string;
  notes?: string | null;
};

export type ContactSubmissionPayload = {
  reference: string;
  submittedAt: Date;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type WeddingRegistrationPayload = {
  reference: string;
  submittedAt: Date;
  groomName: string;
  brideName: string;
  phone: string;
  email: string;
  weddingDate: Date;
  numberGroomsmen: number;
  locationSlug?: string | null;
  notes?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type NewsletterSignupPayload = {
  reference: string;
  submittedAt: Date;
  email: string;
  source: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};
