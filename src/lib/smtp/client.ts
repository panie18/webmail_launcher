import nodemailer from "nodemailer";
import type { MailAccount } from "@/types/mail";

interface SendOptions {
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

export async function sendMessage(account: MailAccount, options: SendOptions) {
  const transporter = nodemailer.createTransport({
    host: account.smtpHost,
    port: account.smtpPort,
    secure: account.smtpSecurity === "ssl",
    auth: {
      user: account.username,
      pass: account.decryptedPassword,
    },
    tls: {
      rejectUnauthorized: true,
    },
  });

  const mailOptions = {
    from: account.email,
    to: options.to.join(", "),
    cc: options.cc?.join(", "),
    bcc: options.bcc?.join(", "),
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments?.map((att) => ({
      filename: att.filename,
      content: att.content,
      contentType: att.contentType,
    })),
  };

  const result = await transporter.sendMail(mailOptions);

  transporter.close();

  return { messageId: result.messageId };
}
