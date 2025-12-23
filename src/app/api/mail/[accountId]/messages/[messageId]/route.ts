import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { MailService } from "@/lib/services/mail-service";
import { rateLimit } from "@/lib/middleware/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: { accountId: string; messageId: string } }
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

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get("folder") || "INBOX";
    const messageId = parseInt(params.messageId, 10);

    if (isNaN(messageId)) {
      return NextResponse.json({ error: "Invalid message ID" }, { status: 400 });
    }

    const message = await MailService.getMessage(
      session.user.id,
      params.accountId,
      folder,
      messageId
    );

    return NextResponse.json(message);
  } catch (error) {
    console.error("Get message error:", error);
    return NextResponse.json({ error: "Failed to fetch message" }, { status: 500 });
  }
}
