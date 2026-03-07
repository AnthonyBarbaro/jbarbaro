import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { canAccessAdmin, createPayloadRequest } from "payload";

import config from "@/payload.config";

function buildRequestURL(pathname: string, requestHeaders: Headers) {
  const protocol = requestHeaders.get("x-forwarded-proto") || "http";
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost:3000";

  return `${protocol}://${host}${pathname}`;
}

export async function createPayloadAdminRequest(pathname: string) {
  const requestHeaders = new Headers(await headers());

  return createPayloadRequest({
    config,
    request: new Request(buildRequestURL(pathname, requestHeaders), {
      headers: requestHeaders,
    }),
  });
}

export async function requirePayloadAdmin(pathname: string) {
  const req = await createPayloadAdminRequest(pathname);

  try {
    await canAccessAdmin({ req });
  } catch {
    redirect(`/cms/login?redirect=${encodeURIComponent(pathname)}`);
  }

  return req;
}
