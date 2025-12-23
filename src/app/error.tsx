"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <AlertTriangle className="h-24 w-24 mx-auto text-destructive mb-6" />
        <h1 className="text-4xl font-bold mb-2">Something went wrong</h1>
        <p className="text-muted-foreground mb-6">An unexpected error occurred</p>
        <Button onClick={() => reset()}>Try again</Button>
      </div>
    </div>
  );
}
