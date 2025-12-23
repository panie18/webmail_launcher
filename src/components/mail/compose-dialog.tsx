"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, X } from "lucide-react";

interface ComposeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  fromEmail: string;
  replyTo?: {
    to: string;
    subject: string;
    body?: string;
  };
}

export function ComposeDialog({
  open,
  onOpenChange,
  accountId,
  fromEmail,
  replyTo,
}: ComposeDialogProps) {
  const [to, setTo] = useState(replyTo?.to || "");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState(
    replyTo?.subject ? `Re: ${replyTo.subject}` : ""
  );
  const [body, setBody] = useState(replyTo?.body || "");
  const [isSending, setIsSending] = useState(false);
  const [showCc, setShowCc] = useState(false);

  const handleSend = async () => {
    if (!to.trim() || !subject.trim()) return;

    setIsSending(true);

    try {
      const res = await fetch(`/api/mail/${accountId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: to.split(",").map((e) => e.trim()),
          cc: cc ? cc.split(",").map((e) => e.trim()) : undefined,
          bcc: bcc ? bcc.split(",").map((e) => e.trim()) : undefined,
          subject,
          text: body,
        }),
      });

      if (res.ok) {
        onOpenChange(false);
        setTo("");
        setCc("");
        setBcc("");
        setSubject("");
        setBody("");
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            From: {fromEmail}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="to" className="w-12">
                To
              </Label>
              <Input
                id="to"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
                className="flex-1"
              />
              {!showCc && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCc(true)}
                >
                  Cc/Bcc
                </Button>
              )}
            </div>

            {showCc && (
              <>
                <div className="flex items-center gap-2">
                  <Label htmlFor="cc" className="w-12">
                    Cc
                  </Label>
                  <Input
                    id="cc"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="bcc" className="w-12">
                    Bcc
                  </Label>
                  <Input
                    id="bcc"
                    value={bcc}
                    onChange={(e) => setBcc(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </>
            )}

            <div className="flex items-center gap-2">
              <Label htmlFor="subject" className="w-12">
                Subject
              </Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message..."
            className="min-h-[300px]"
          />

          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon">
              <Paperclip className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSend} disabled={isSending}>
                <Send className="mr-2 h-4 w-4" />
                {isSending ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
