"use client";

import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Star, Paperclip } from "lucide-react";
import type { MailMessage } from "@/types/mail";

interface MessageListProps {
  messages: MailMessage[];
  selectedMessage: MailMessage | null;
  onSelect: (message: MailMessage) => void;
}

export function MessageList({ messages, selectedMessage, onSelect }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>No messages in this folder</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {messages.map((message) => {
        const isRead = message.flags.includes("\\Seen");
        const isStarred = message.flags.includes("\\Flagged");
        const isSelected = selectedMessage?.uid === message.uid;

        return (
          <button
            key={message.uid}
            onClick={() => onSelect(message)}
            className={cn(
              "w-full p-4 text-left hover:bg-muted/50 transition-colors",
              isSelected && "bg-muted",
              !isRead && "bg-primary/5"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      "text-sm truncate",
                      !isRead && "font-semibold"
                    )}
                  >
                    {message.from}
                  </span>
                  {isStarred && (
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 shrink-0" />
                  )}
                  {message.hasAttachments && (
                    <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />
                  )}
                </div>
                <p
                  className={cn(
                    "text-sm truncate",
                    !isRead && "font-medium"
                  )}
                >
                  {message.subject || "(No subject)"}
                </p>
                {message.preview && (
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {message.preview}
                  </p>
                )}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDate(message.date)}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
