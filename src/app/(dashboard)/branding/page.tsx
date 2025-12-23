"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2, Upload } from "lucide-react";

interface BrandingData {
  appName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  footerText: string;
  showPoweredBy: boolean;
}

export default function BrandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [branding, setBranding] = useState<BrandingData>({
    appName: "Webmail Launcher",
    logoUrl: null,
    faviconUrl: null,
    primaryColor: "#0066FF",
    secondaryColor: "#1a1a2e",
    accentColor: "#00D4FF",
    footerText: "",
    showPoweredBy: true,
  });

  useEffect(() => {
    loadBranding();
  }, []);

  const loadBranding = async () => {
    setIsLoading(true);
    const res = await fetch("/api/branding");
    if (res.ok) {
      const data = await res.json();
      setBranding(data);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await fetch("/api/branding", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(branding),
    });
    setIsSaving(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("logo", file);

    const res = await fetch("/api/branding/logo", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      loadBranding();
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Branding</h1>
        <p className="text-muted-foreground">
          Customize the appearance of your webmail launcher
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>
            Basic branding settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="appName">Application Name</Label>
            <Input
              id="appName"
              value={branding.appName}
              onChange={(e) => setBranding({ ...branding, appName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              {branding.logoUrl && (
                <img
                  src={branding.logoUrl}
                  alt="Logo"
                  className="h-16 w-16 object-contain border rounded"
                />
              )}
              <Label
                htmlFor="logo-upload"
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted">
                  <Upload className="h-4 w-4" />
                  Upload Logo
                </div>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="footerText">Footer Text</Label>
            <Input
              id="footerText"
              value={branding.footerText}
              onChange={(e) => setBranding({ ...branding, footerText: e.target.value })}
              placeholder="© 2024 Your Company"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show "Powered by"</Label>
              <p className="text-sm text-muted-foreground">
                Display attribution in the footer
              </p>
            </div>
            <Switch
              checked={branding.showPoweredBy}
              onCheckedChange={(v) => setBranding({ ...branding, showPoweredBy: v })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Colors</CardTitle>
          <CardDescription>
            Customize the color scheme
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={branding.primaryColor}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  className="h-10 w-10 rounded border cursor-pointer"
                />
                <Input
                  id="primaryColor"
                  value={branding.primaryColor}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={branding.secondaryColor}
                  onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                  className="h-10 w-10 rounded border cursor-pointer"
                />
                <Input
                  id="secondaryColor"
                  value={branding.secondaryColor}
                  onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accentColor">Accent Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={branding.accentColor}
                  onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                  className="h-10 w-10 rounded border cursor-pointer"
                />
                <Input
                  id="accentColor"
                  value={branding.accentColor}
                  onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
