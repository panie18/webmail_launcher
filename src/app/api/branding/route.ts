import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/lib/auth/session";
import { BrandingService } from "@/lib/services/branding-service";
import { rateLimit } from "@/lib/middleware/rate-limit";
import { validateCSRF } from "@/lib/middleware/csrf";
import { sanitizeInput } from "@/lib/utils/sanitize";

const brandingSchema = z.object({
  appName: z.string().min(1).max(50).transform(sanitizeInput),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  footerText: z.string().max(200).transform(sanitizeInput).optional(),
  showPoweredBy: z.boolean().default(true),
});

// GET /api/branding - Get current branding (public)
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: rateLimitResult.headers }
      );
    }

    const branding = await BrandingService.getBranding();
    return NextResponse.json({ branding });
  } catch (error) {
    console.error("Failed to get branding:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/branding - Update branding (admin only)
export async function PUT(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, { max: 10, window: 60000 });
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
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = brandingSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const branding = await BrandingService.updateBranding(validationResult.data);
    
    return NextResponse.json({ branding });
  } catch (error) {
    console.error("Failed to update branding:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
