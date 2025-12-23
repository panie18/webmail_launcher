import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

interface BrandingData {
  appName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  footerText?: string;
  showPoweredBy: boolean;
}

export class BrandingService {
  static async getBranding() {
    const [branding] = await db
      .select()
      .from(schema.branding)
      .where(eq(schema.branding.id, 1))
      .limit(1);

    if (!branding) {
      return {
        appName: "Webmail Launcher",
        logoUrl: null,
        faviconUrl: null,
        primaryColor: "#0066FF",
        secondaryColor: "#1a1a2e",
        accentColor: "#00D4FF",
        footerText: "",
        showPoweredBy: true,
      };
    }

    return {
      appName: branding.appName,
      logoUrl: branding.logoData ? "/api/branding/logo" : null,
      faviconUrl: branding.faviconData ? "/api/branding/favicon" : null,
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
      accentColor: branding.accentColor,
      footerText: branding.footerText || "",
      showPoweredBy: branding.showPoweredBy,
    };
  }

  static async updateBranding(data: BrandingData) {
    const existing = await db
      .select({ id: schema.branding.id })
      .from(schema.branding)
      .where(eq(schema.branding.id, 1))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(schema.branding).values({
        id: 1,
        ...data,
        updatedAt: new Date(),
      });
    } else {
      await db
        .update(schema.branding)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(schema.branding.id, 1));
    }

    return this.getBranding();
  }

  static async uploadLogo(data: Buffer, mimeType: string) {
    await db
      .update(schema.branding)
      .set({ logoData: data, logoMimeType: mimeType, updatedAt: new Date() })
      .where(eq(schema.branding.id, 1));
  }

  static async uploadFavicon(data: Buffer, mimeType: string) {
    await db
      .update(schema.branding)
      .set({ faviconData: data, faviconMimeType: mimeType, updatedAt: new Date() })
      .where(eq(schema.branding.id, 1));
  }
}
