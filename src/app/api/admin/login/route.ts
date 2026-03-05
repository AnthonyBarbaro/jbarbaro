import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ADMIN_COOKIE_NAME } from "@/lib/constants";

const loginSchema = z.object({
  password: z.string().min(1),
  nextPath: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid login payload." }, { status: 400 });
  }

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ message: "ADMIN_PASSWORD is not configured." }, { status: 500 });
  }

  if (parsed.data.password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ message: "Incorrect password." }, { status: 401 });
  }

  const redirectTo = parsed.data.nextPath && parsed.data.nextPath.startsWith("/")
    ? parsed.data.nextPath
    : "/admin/appointments";

  const response = NextResponse.json({ redirectTo });
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: process.env.ADMIN_PASSWORD,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}
