import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/lib/auth/session";
import { AccountService } from "@/lib/services/account-service";
import { rateLimit } from "@/lib/middleware/rate-limit";
import { validateCSRF } from "@/lib/middleware/csrf";
import { sanitizeInput } from "@/lib/utils/sanitize";

const updateAccountSchema = z.object({
  name: z.string().min(1).max(100).transform(sanitizeInput).optional(),
  imapHost: z.string().min(1).max(255).optional(),
  imapPort: z.number().int().min(1).max(65535).optional(),
  imapSecurity: z.enum(["none", "starttls", "ssl"]).optional(),
  smtpHost: z.string().min(1).max(255).optional(),
  smtpPort: z.number().int().min(1).max(65535).optional(),
  smtpSecurity: z.enum(["none", "starttls", "ssl"]).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rateLimitResult = await rateLimit(request);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account = await AccountService.getAccount(session.user.id, params.id);
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const { encryptedPassword, ...safeAccount } = account;
    return NextResponse.json({ account: safeAccount });
  } catch (error) {
    console.error("Get account error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rateLimitResult = await rateLimit(request, { max: 20, window: 60000 });
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const csrfValid = await validateCSRF(request);
    if (!csrfValid) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateAccountSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const account = await AccountService.updateAccount(
      session.user.id,
      params.id,
      validation.data,
      body.password
    );

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json({ account: { id: account.id, name: account.name } });
  } catch (error) {
    console.error("Update account error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rateLimitResult = await rateLimit(request, { max: 10, window: 60000 });
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const csrfValid = await validateCSRF(request);
    if (!csrfValid) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await AccountService.deleteAccount(session.user.id, params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
