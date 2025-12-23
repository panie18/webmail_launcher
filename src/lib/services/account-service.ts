import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { encrypt, decrypt } from "@/lib/crypto/encryption";

interface CreateAccountData {
  name: string;
  email: string;
  imapHost: string;
  imapPort: number;
  imapSecurity: "none" | "starttls" | "ssl";
  smtpHost: string;
  smtpPort: number;
  smtpSecurity: "none" | "starttls" | "ssl";
  username: string;
}

interface UpdateAccountData {
  name?: string;
  imapHost?: string;
  imapPort?: number;
  imapSecurity?: "none" | "starttls" | "ssl";
  smtpHost?: string;
  smtpPort?: number;
  smtpSecurity?: "none" | "starttls" | "ssl";
}

export class AccountService {
  static async listAccounts(userId: string) {
    return db
      .select()
      .from(schema.mailAccounts)
      .where(eq(schema.mailAccounts.userId, userId));
  }

  static async getAccount(userId: string, accountId: string) {
    const [account] = await db
      .select()
      .from(schema.mailAccounts)
      .where(
        and(
          eq(schema.mailAccounts.id, accountId),
          eq(schema.mailAccounts.userId, userId)
        )
      )
      .limit(1);
    return account;
  }

  static async createAccount(
    userId: string,
    data: CreateAccountData,
    password: string
  ) {
    const encryptedPassword = await encrypt(password);

    const account = {
      id: crypto.randomUUID(),
      userId,
      ...data,
      encryptedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(schema.mailAccounts).values(account);
    return account;
  }

  static async updateAccount(
    userId: string,
    accountId: string,
    data: UpdateAccountData,
    newPassword?: string
  ) {
    const existing = await this.getAccount(userId, accountId);
    if (!existing) return null;

    const updateData: any = { ...data, updatedAt: new Date() };

    if (newPassword) {
      updateData.encryptedPassword = await encrypt(newPassword);
    }

    await db
      .update(schema.mailAccounts)
      .set(updateData)
      .where(
        and(
          eq(schema.mailAccounts.id, accountId),
          eq(schema.mailAccounts.userId, userId)
        )
      );

    return this.getAccount(userId, accountId);
  }

  static async deleteAccount(userId: string, accountId: string) {
    await db
      .delete(schema.mailAccounts)
      .where(
        and(
          eq(schema.mailAccounts.id, accountId),
          eq(schema.mailAccounts.userId, userId)
        )
      );
  }

  static async getDecryptedPassword(userId: string, accountId: string): Promise<string | null> {
    const account = await this.getAccount(userId, accountId);
    if (!account) return null;
    return decrypt(account.encryptedPassword);
  }
}
