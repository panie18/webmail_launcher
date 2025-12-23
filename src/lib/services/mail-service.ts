import { AccountService } from "./account-service";
import * as imapClient from "@/lib/imap/client";
import * as smtpClient from "@/lib/smtp/client";
import type { MailAccount } from "@/types/mail";

interface ListMessagesOptions {
  folder: string;
  page: number;
  limit: number;
  search?: string;
}

interface SendMessageOptions {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

export class MailService {
  static async listFolders(userId: string, accountId: string) {
    const account = await this.getAccountWithCredentials(userId, accountId);
    if (!account) throw new Error("Account not found");
    return imapClient.listFolders(account);
  }

  static async listMessages(
    userId: string,
    accountId: string,
    options: ListMessagesOptions
  ) {
    const account = await this.getAccountWithCredentials(userId, accountId);
    if (!account) throw new Error("Account not found");
    return imapClient.listMessages(account, options.folder, options);
  }

  static async getMessage(
    userId: string,
    accountId: string,
    folder: string,
    messageId: number
  ) {
    const account = await this.getAccountWithCredentials(userId, accountId);
    if (!account) throw new Error("Account not found");
    return imapClient.fetchMessage(account, folder, messageId);
  }

  static async sendMessage(
    userId: string,
    accountId: string,
    options: SendMessageOptions
  ) {
    const account = await this.getAccountWithCredentials(userId, accountId);
    if (!account) throw new Error("Account not found");
    return smtpClient.sendMessage(account, options);
  }

  private static async getAccountWithCredentials(
    userId: string,
    accountId: string
  ): Promise<MailAccount | null> {
    const account = await AccountService.getAccount(userId, accountId);
    if (!account) return null;

    const password = await AccountService.getDecryptedPassword(userId, accountId);
    if (!password) return null;

    return { ...account, decryptedPassword: password } as MailAccount;
  }
}
