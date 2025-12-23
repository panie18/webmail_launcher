import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { randomBytes, timingSafeEqual } from "crypto";

const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";

export function generateCSRFToken(): string {
  return randomBytes(32).toString("hex");
}

export async function validateCSRF(request: NextRequest): Promise<boolean> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get(CSRF_HEADER);

  if (!cookieToken || !headerToken) {
    return false;
  }

  try {
    const cookieBuffer = Buffer.from(cookieToken, "hex");
    const headerBuffer = Buffer.from(headerToken, "hex");

    if (cookieBuffer.length !== headerBuffer.length) {
      return false;
    }

    return timingSafeEqual(cookieBuffer, headerBuffer);
  } catch {
    return false;
  }
}
