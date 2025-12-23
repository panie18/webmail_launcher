export interface MailAccount {
  id: string;
  userId: string;
  name: string;
  email: string;
  username: string;
  encryptedPassword: string;
  decryptedPassword?: string;
  imapHost: string;
  imapPort: number;
  imapSecurity: "none" | "starttls" | "ssl";
  smtpHost: string;
  smtpPort: number;
  smtpSecurity: "none" | "starttls" | "ssl";
  createdAt: Date;
  updatedAt: Date;
}

export interface MailFolder {
  name: string;
  path: string;
  delimiter: string;
  flags: string[];
}

export interface MailMessage {
  seqno: number;
  uid: number;
  from: string;
  to: string;
  subject: string;
  date: Date;
  flags: string[];
  hasAttachments?: boolean;
  preview?: string;
}

export interface MailAttachment {
  filename: string;
  contentType: string;
  size: number;
  content?: Buffer;
}
