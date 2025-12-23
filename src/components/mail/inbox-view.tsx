"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { FolderList } from "./folder-list";
import { MessageList } from "./message-list";
import { MessageView } from "./message-view";
import { ComposeDialog } from "./compose-dialog";
import {
  RefreshCw,
  Search,
  PenSquare,
  Inbox,
  Send,
  Archive,
  Trash2,
} from "lucide-react";

interface InboxViewProps {
  accountId: string;
}

export function InboxView({ accountId }: InboxViewProps) {
  const [selectedFolder, setSelectedFolder] = useState("INBOX");
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  const { data: folders, isLoading: foldersLoading } = useQuery({
    queryKey: ["folders", accountId],
    queryFn: () => fetch(`/api/mail/${accountId}/folders`).then((r) => r.json()),
  });

  const {
    data: messages,
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ["messages", accountId, selectedFolder, searchQuery],
    queryFn: () =>
      fetch(
        `/api/mail/${accountId}/messages?folder=${encodeURIComponent(selectedFolder)}&search=${encodeURIComponent(searchQuery)}`
      ).then((r) => r.json()),
  });

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-card/50 backdrop-blur-sm">
        <Button
          onClick={() => setIsComposeOpen(true)}
          className="gap-2 bg-primary hover:bg-primary/90"
        >
          <PenSquare className="h-4 w-4" />
          Compose
        </Button>

        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50"
            />
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetchMessages()}
          className="ml-auto"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Main Content */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Folder Sidebar */}
        <ResizablePanel defaultSize={15} minSize={10} maxSize={25}>
          <ScrollArea className="h-full">
            <div className="p-2">
              {foldersLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : (
                <FolderList
                  folders={folders?.folders || []}
                  selectedFolder={selectedFolder}
                  onSelectFolder={setSelectedFolder}
                />
              )}
            </div>
          </ScrollArea>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Message List */}
        <ResizablePanel defaultSize={35} minSize={25}>
          <ScrollArea className="h-full">
            {messagesLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <MessageList
                messages={messages?.messages || []}
                selectedId={selectedMessageId}
                onSelect={setSelectedMessageId}
              />
            )}
          </ScrollArea>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Message View */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <AnimatePresence mode="wait">
            {selectedMessageId ? (
              <motion.div
                key={selectedMessageId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full"
              >
                <MessageView
                  accountId={accountId}
                  folder={selectedFolder}
                  messageId={selectedMessageId}
                  onReply={() => setIsComposeOpen(true)}
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex items-center justify-center text-muted-foreground"
              >
                <div className="text-center">
                  <Inbox className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Select a message to read</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Compose Dialog */}
      <ComposeDialog
        open={isComposeOpen}
        onOpenChange={setIsComposeOpen}
        accountId={accountId}
      />
    </div>
  );
}
