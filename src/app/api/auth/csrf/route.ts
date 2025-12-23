import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateCSRFToken } from "@/lib/middleware/csrf";

export async function GET() {
  const token = generateCSRFToken();
  const cookieStore = await cookies();

  cookieStore.set("csrf_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60,
  });

  return NextResponse.json({ token });
}
