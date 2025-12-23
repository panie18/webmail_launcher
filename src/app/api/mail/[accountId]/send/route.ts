import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { MailService } from "@/lib/services/mail-service";
import { rateLimit } from "@/lib/middleware/rate-limit";
import { validateCSRF } from "@/lib/middleware/csrf";

export async function POST(
  request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  try {
    const rateLimitResult = await rateLimit(request, { max: 30, window: 60000 });
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

    const formData = await request.formData();
    const to = formData.get("to") as string;
    const cc = formData.get("cc") as string;
    const subject = formData.get("subject") as string;
    const body = formData.get("body") as string;

    if (!to) {
      return NextResponse.json({ error: "Recipient required" }, { status: 400 });
    }

    const attachments: Array<{ filename: string; content: Buffer; contentType: string }> = [];
    const files = formData.getAll("attachments");

    for (const file of files) {
      if (file instanceof File) {
        const buffer = Buffer.from(await file.arrayBuffer());
        attachments.push({
          filename: file.name,
          content: buffer,
          contentType: file.type,
        });
      }
    }

    const result = await MailService.sendMessage(session.user.id, params.accountId, {
      to: to.split(",").map((e) => e.trim()),
      cc: cc ? cc.split(",").map((e) => e.trim()) : undefined,
      subject,
      text: body,
      attachments,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
