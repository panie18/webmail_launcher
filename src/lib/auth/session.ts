import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { readFileSync } from "fs";
import { db, schema } from "@/lib/db";
import { eq, and, gt } from "drizzle-orm";

const SESSION_COOKIE = "session";
const SESSION_DURATION = 60 * 60 * 1000;

let jwtSecret: Uint8Array | null = null;

function getJwtSecret(): Uint8Array {
  if (jwtSecret) return jwtSecret;

  const secretPath = process.env.JWT_SECRET_FILE;
  if (!secretPath) {
    throw new Error("JWT_SECRET_FILE not configured");
  }

  const secret = readFileSync(secretPath, "utf-8").trim();
  jwtSecret = new TextEncoder().encode(secret);
  return jwtSecret;
}

interface SessionPayload {
  userId: string;
  sessionId: string;
}

export interface Session {
  user: {
    id: string;
    email: string;
    role: "admin" | "user";
  };
}

export async function createSession(userId: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  await db.insert(schema.sessions).values({
    id: sessionId,
    userId,
    expiresAt,
    createdAt: new Date(),
  });

  const token = await new SignJWT({ userId, sessionId } satisfies SessionPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresAt)
    .setIssuedAt()
    .sign(getJwtSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: expiresAt,
    path: "/",
  });

  return sessionId;
}

export async function getServerSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) return null;

    const { payload } = await jwtVerify<SessionPayload>(token, getJwtSecret());

    const [session] = await db
      .select()
      .from(schema.sessions)
      .where(
        and(
          eq(schema.sessions.id, payload.sessionId),
          eq(schema.sessions.userId, payload.userId),
          gt(schema.sessions.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!session) return null;

    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, session.userId))
      .limit(1);

    if (!user) return null;

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  } catch {
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    try {
      const { payload } = await jwtVerify<SessionPayload>(token, getJwtSecret());
      await db.delete(schema.sessions).where(eq(schema.sessions.id, payload.sessionId));
    } catch {}
  }

  cookieStore.delete(SESSION_COOKIE);
}
