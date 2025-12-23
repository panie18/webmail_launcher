import Imap from "imap";
import { simpleParser, ParsedMail } from "mailparser";
import { decrypt } from "@/lib/crypto/encryption";
import type { MailAccount, MailMessage, MailFolder } from "@/types/mail";

interface IMAPConfig {
  host: string;
  port: number;
  tls: boolean;
  user: string;
  password: string;
}

/**
 * Create IMAP connection with decrypted credentials
 * Credentials are decrypted just-in-time and cleared after use
 */
async function createConnection(account: MailAccount): Promise<Imap> {
  // Decrypt password just-in-time
  const password = await decrypt(account.encryptedPassword);

  const config: IMAPConfig = {
    host: account.imapHost,
    port: account.imapPort,
    tls: account.imapSecurity === "ssl",
    user: account.username,
    password,
  };

  return new Promise((resolve, reject) => {
    const imap = new Imap({
      ...config,
      tlsOptions: { rejectUnauthorized: true },
      connTimeout: 10000,
      authTimeout: 5000,
    });

    imap.once("ready", () => {
      // Clear password from memory after connection
      config.password = "";
      resolve(imap);
    });

    imap.once("error", (err: Error) => {
      config.password = "";
      reject(err);
    });

    imap.connect();
  });
}

/**
 * List folders for account
 */
export async function listFolders(account: MailAccount): Promise<MailFolder[]> {
  const imap = await createConnection(account);

  return new Promise((resolve, reject) => {
    imap.getBoxes((err, boxes) => {
      imap.end();
      if (err) {
        reject(err);
        return;
      }

      const folders: MailFolder[] = [];
      const processBoxes = (boxes: Imap.MailBoxes, prefix = "") => {
        for (const [name, box] of Object.entries(boxes)) {
          const path = prefix ? `${prefix}${box.delimiter}${name}` : name;
          folders.push({
            name,
            path,
            delimiter: box.delimiter,
            flags: box.attribs,
          });
          if (box.children) {
            processBoxes(box.children, path);
          }
        }
      };
      processBoxes(boxes);
      resolve(folders);
    });
  });
}

/**
 * List messages in folder
 */
export async function listMessages(
  account: MailAccount,
  folder: string,
  options: { page: number; limit: number; search?: string }
): Promise<{ messages: MailMessage[]; total: number }> {
  const imap = await createConnection(account);

  return new Promise((resolve, reject) => {
    imap.openBox(folder, true, (err, box) => {
      if (err) {
        imap.end();
        reject(err);
        return;
      }

      const total = box.messages.total;
      const start = Math.max(1, total - options.page * options.limit + 1);
      const end = Math.max(1, total - (options.page - 1) * options.limit);

      if (start > end || total === 0) {
        imap.end();
        resolve({ messages: [], total });
        return;
      }

      const range = `${start}:${end}`;
      const fetch = imap.seq.fetch(range, {
        bodies: ["HEADER.FIELDS (FROM TO SUBJECT DATE)", "TEXT"],
        struct: true,
      });

      const messages: MailMessage[] = [];

      fetch.on("message", (msg, seqno) => {
        const message: Partial<MailMessage> = { seqno };

        msg.on("body", (stream, info) => {
          let buffer = "";
          stream.on("data", (chunk) => {
            buffer += chunk.toString("utf8");
          });
          stream.once("end", () => {
            if (info.which.includes("HEADER")) {
              // Parse header
              const lines = buffer.split("\r\n");
              for (const line of lines) {
                const [key, ...value] = line.split(": ");
                const val = value.join(": ");
                switch (key?.toLowerCase()) {
                  case "from":
                    message.from = val;
                    break;
                  case "to":
                    message.to = val;
                    break;
                  case "subject":
                    message.subject = val;
                    break;
                  case "date":
                    message.date = new Date(val);
                    break;
                }
              }
            }
          });
        });

        msg.once("attributes", (attrs) => {
          message.uid = attrs.uid;
          message.flags = attrs.flags;
        });

        msg.once("end", () => {
          messages.push(message as MailMessage);
        });
      });

      fetch.once("error", (err) => {
        imap.end();
        reject(err);
      });

      fetch.once("end", () => {
        imap.end();
        // Sort by date descending
        messages.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
        resolve({ messages, total });
      });
    });
  });
}

/**
 * Fetch single message with full body
 */
export async function fetchMessage(
  account: MailAccount,
  folder: string,
  uid: number
): Promise<ParsedMail> {
  const imap = await createConnection(account);

  return new Promise((resolve, reject) => {
    imap.openBox(folder, true, (err) => {
      if (err) {
        imap.end();
        reject(err);
        return;
      }

      const fetch = imap.fetch(uid, { bodies: "", struct: true });

      fetch.on("message", (msg) => {
        msg.on("body", (stream) => {
          simpleParser(stream, (err, parsed) => {
            imap.end();
            if (err) {
              reject(err);
            } else {
              resolve(parsed);
            }
          });
        });
      });

      fetch.once("error", (err) => {
        imap.end();
        reject(err);
      });
    });
  });
}
