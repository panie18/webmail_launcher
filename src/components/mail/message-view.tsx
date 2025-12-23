"use client";

import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Reply, ReplyAll, Forward, Trash2, Archive, Star, Download } from "lucide-react";
import { formatDate, formatBytes } from "@/lib/utils";
import type { MailMessage, MailAttachment } from "@/types/mail";

interface MessageViewProps {
  accountId: string;
  folder: string;
  message: MailMessage;
}

interface FullMessage extends MailMessage {
  html?: string;
  text?: string;
  attachments?: MailAttachment[];
}

export function MessageView({ accountId, folder, message }: MessageViewProps) {
  const [fullMessage, setFullMessage] = useState<FullMessage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMessage = async () => {
      setIsLoading(true);
      const res = await fetch(
        `/api/mail/${accountId}/messages/${message.uid}?folder=${encodeURIComponent(folder)}`
      );
      if (res.ok) {
        const data = await res.json();
        setFullMessage(data);
      }
      setIsLoading(false);
    };

    loadMessage();
  }, [accountId, folder, message.uid]);

  const getInitials = (email: string) => {
    const name = email.split("@")[0] || "";
    return name.slice(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-start gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Separator />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!fullMessage) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Failed to load message
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Reply className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <ReplyAll className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <Forward className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button variant="ghost" size="icon">
          <Archive className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <Star className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <Avatar>
              <AvatarFallback>{getInitials(fullMessage.from)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{fullMessage.from}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                To: {fullMessage.to}
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date(fullMessage.date).toLocaleString()}
              </div>
            </div>
          </div>

          <h1 className="text-xl font-semibold mb-4">
            {fullMessage.subject || "(No subject)"}
          </h1>

          <Separator className="my-4" />

          {fullMessage.html ? (
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: fullMessage.html }}
            />
          ) : (
            <pre className="whitespace-pre-wrap text-sm">
              {fullMessage.text || "(No content)"}
            </pre>
          )}

          {fullMessage.attachments && fullMessage.attachments.length > 0 && (
            <>
              <Separator className="my-4" />
              <div>
                <h3 className="text-sm font-medium mb-2">
                  Attachments ({fullMessage.attachments.length})
                </h3>
                <div className="space-y-2">
                  {fullMessage.attachments.map((att, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 border rounded-md"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {att.filename}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(att.size)}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
