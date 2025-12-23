import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/lib/auth/session";
import { MailService } from "@/lib/services/mail-service";
import { rateLimit } from "@/lib/middleware/rate-limit";

const querySchema = z.object({
  folder: z.string().default("INBOX"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().max(500).optional(),
});

// GET /api/mail/[accountId]/messages - List messages in folder
export async function GET(
  request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  try {
    const rateLimitResult = await rateLimit(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: rateLimitResult.headers }
      );
    }

    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse(Object.fromEntries(searchParams));
    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters" },
        { status: 400 }
      );
    }

    const { folder, page, limit, search } = queryResult.data;
    const accountId = params.accountId;

    // Fetch messages via IMAP
    const result = await MailService.listMessages(
      session.user.id,
      accountId,
      {
        folder,
        page,
        limit,
        search,
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to list messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
