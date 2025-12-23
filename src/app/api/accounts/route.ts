import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/lib/auth/session";
import { AccountService } from "@/lib/services/account-service";
import { rateLimit } from "@/lib/middleware/rate-limit";
import { validateCSRF } from "@/lib/middleware/csrf";
import { sanitizeInput } from "@/lib/utils/sanitize";

// Validation schema - strict input validation
const createAccountSchema = z.object({
  name: z.string().min(1).max(100).transform(sanitizeInput),
  email: z.string().email().max(255),
  imapHost: z.string().min(1).max(255),
  imapPort: z.number().int().min(1).max(65535),
  imapSecurity: z.enum(["none", "starttls", "ssl"]),
  smtpHost: z.string().min(1).max(255),
  smtpPort: z.number().int().min(1).max(65535),
  smtpSecurity: z.enum(["none", "starttls", "ssl"]),
  username: z.string().min(1).max(255),
  // Password handled separately - never logged
});

// GET /api/accounts - List all accounts for current user
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: rateLimitResult.headers }
      );
    }

    // Authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accounts = await AccountService.listAccounts(session.user.id);
    
    // Never return credentials in list response
    const safeAccounts = accounts.map(({ id, name, email, imapHost, smtpHost, createdAt }) => ({
      id,
      name,
      email,
      imapHost,
      smtpHost,
      createdAt,
    }));

    return NextResponse.json({ accounts: safeAccounts });
  } catch (error) {
    console.error("Failed to list accounts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/accounts - Create new mail account
export async function POST(request: NextRequest) {
  try {
    // Rate limiting (stricter for mutations)
    const rateLimitResult = await rateLimit(request, { max: 10, window: 60000 });
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: rateLimitResult.headers }
      );
    }

    // CSRF validation
    const csrfValid = await validateCSRF(request);
    if (!csrfValid) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    // Authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = createAccountSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    // Extract password separately (never in validation logs)
    const password = body.password;
    if (!password || typeof password !== "string" || password.length < 1) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    const account = await AccountService.createAccount(
      session.user.id,
      validationResult.data,
      password // Encrypted before storage
    );

    return NextResponse.json(
      { 
        account: { 
          id: account.id, 
          name: account.name, 
          email: account.email 
        } 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
