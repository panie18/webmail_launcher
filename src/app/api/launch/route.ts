import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/lib/auth/session";
import { LaunchService } from "@/lib/services/launch-service";
import { rateLimit } from "@/lib/middleware/rate-limit";
import { validateCSRF } from "@/lib/middleware/csrf";

// Short-lived token for webmail launch
const TOKEN_EXPIRY_SECONDS = 300; // 5 minutes

const launchSchema = z.object({
  accountId: z.string().uuid(),
  webmailBackend: z.enum(["native", "snappymail", "roundcube"]),
});

// POST /api/launch - Generate short-lived launch token
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, { max: 20, window: 60000 });
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: rateLimitResult.headers }
      );
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
    const validationResult = launchSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed" },
        { status: 400 }
      );
    }

    const { accountId, webmailBackend } = validationResult.data;

    // Verify user owns this account
    const hasAccess = await LaunchService.verifyAccountAccess(
      session.user.id,
      accountId
    );
    if (!hasAccess) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Generate short-lived token
    const launchToken = await LaunchService.generateLaunchToken(
      accountId,
      webmailBackend,
      TOKEN_EXPIRY_SECONDS
    );

    // Build launch URL based on backend
    const launchUrl = LaunchService.buildLaunchUrl(webmailBackend, launchToken);

    return NextResponse.json({
      launchUrl,
      expiresIn: TOKEN_EXPIRY_SECONDS,
    });
  } catch (error) {
    console.error("Failed to generate launch token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
