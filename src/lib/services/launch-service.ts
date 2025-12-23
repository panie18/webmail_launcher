import { db, schema } from "@/lib/db";
import { eq, and, gt, isNull } from "drizzle-orm";
import { randomBytes } from "crypto";

type WebmailBackend = "native" | "snappymail" | "roundcube";

export class LaunchService {
  static async verifyAccountAccess(userId: string, accountId: string): Promise<boolean> {
    const [account] = await db
      .select({ id: schema.mailAccounts.id })
      .from(schema.mailAccounts)
      .where(
        and(
          eq(schema.mailAccounts.id, accountId),
          eq(schema.mailAccounts.userId, userId)
        )
      )
      .limit(1);
    return !!account;
  }

  static async generateLaunchToken(
    accountId: string,
    backend: WebmailBackend,
    expirySeconds: number
  ): Promise<string> {
    const tokenId = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + expirySeconds * 1000);

    await db.insert(schema.launchTokens).values({
      id: tokenId,
      accountId,
      backend,
      expiresAt,
      createdAt: new Date(),
    });

    return tokenId;
  }

  static async validateAndConsumeLaunchToken(
    token: string
  ): Promise<{ accountId: string; backend: WebmailBackend } | null> {
    const [launchToken] = await db
      .select()
      .from(schema.launchTokens)
      .where(
        and(
          eq(schema.launchTokens.id, token),
          gt(schema.launchTokens.expiresAt, new Date()),
          isNull(schema.launchTokens.usedAt)
        )
      )
      .limit(1);

    if (!launchToken) return null;

    await db
      .update(schema.launchTokens)
      .set({ usedAt: new Date() })
      .where(eq(schema.launchTokens.id, token));

    return {
      accountId: launchToken.accountId,
      backend: launchToken.backend,
    };
  }

  static buildLaunchUrl(backend: WebmailBackend, token: string): string {
    const baseUrls: Record<WebmailBackend, string> = {
      native: "/webmail",
      snappymail: "/snappymail",
      roundcube: "/roundcube",
    };

    return `${baseUrls[backend]}?token=${token}`;
  }
}
