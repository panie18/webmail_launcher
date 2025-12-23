import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "user"] }).notNull().default("user"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const mailAccounts = sqliteTable("mail_accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  username: text("username").notNull(),
  encryptedPassword: text("encrypted_password").notNull(),
  imapHost: text("imap_host").notNull(),
  imapPort: integer("imap_port").notNull(),
  imapSecurity: text("imap_security", { enum: ["none", "starttls", "ssl"] }).notNull(),
  smtpHost: text("smtp_host").notNull(),
  smtpPort: integer("smtp_port").notNull(),
  smtpSecurity: text("smtp_security", { enum: ["none", "starttls", "ssl"] }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const branding = sqliteTable("branding", {
  id: integer("id").primaryKey().default(1),
  appName: text("app_name").notNull().default("Webmail Launcher"),
  logoData: blob("logo_data"),
  logoMimeType: text("logo_mime_type"),
  faviconData: blob("favicon_data"),
  faviconMimeType: text("favicon_mime_type"),
  primaryColor: text("primary_color").notNull().default("#0066FF"),
  secondaryColor: text("secondary_color").notNull().default("#1a1a2e"),
  accentColor: text("accent_color").notNull().default("#00D4FF"),
  footerText: text("footer_text").default(""),
  showPoweredBy: integer("show_powered_by", { mode: "boolean" }).notNull().default(true),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const launchTokens = sqliteTable("launch_tokens", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull().references(() => mailAccounts.id, { onDelete: "cascade" }),
  backend: text("backend", { enum: ["native", "snappymail", "roundcube"] }).notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  usedAt: integer("used_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
