import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { eq, count } from "drizzle-orm";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { rateLimit } from "@/lib/middleware/rate-limit";

const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
});

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, { max: 3, window: 3600000 });
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many registration attempts" },
        { status: 429, headers: rateLimitResult.headers }
      );
    }

    const body = await request.json();
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;
    const normalizedEmail = email.toLowerCase();

    const [existing] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, normalizedEmail))
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const [userCount] = await db.select({ value: count() }).from(schema.users);
    const isFirstUser = userCount.value === 0;

    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();

    await db.insert(schema.users).values({
      id: userId,
      email: normalizedEmail,
      passwordHash,
      role: isFirstUser ? "admin" : "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await createSession(userId);

    return NextResponse.json(
      { user: { id: userId, email: normalizedEmail, role: isFirstUser ? "admin" : "user" } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
