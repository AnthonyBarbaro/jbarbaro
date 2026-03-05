import { cookies } from "next/headers";

import { ADMIN_COOKIE_NAME } from "@/lib/constants";

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const value = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  return Boolean(value && process.env.ADMIN_PASSWORD && value === process.env.ADMIN_PASSWORD);
}
