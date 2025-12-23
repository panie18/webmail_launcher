"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { MailFolder } from "@/types/mail";

interface FolderListProps {
  folders: MailFolder[];
  selectedFolder: string;
  onSelect: (folder: string) => void;
  getFolderIcon: (name: string) => React.ReactNode;
}

export function FolderList({
  folders,
  selectedFolder,
  onSelect,
  getFolderIcon,
}: FolderListProps) {
  const standardFolders = ["INBOX", "Sent", "Drafts", "Trash", "Spam"];
  const sortedFolders = folders.sort((a, b) => {
    const aIndex = standardFolders.findIndex((f) =>
      a.name.toLowerCase().includes(f.toLowerCase())
    );
    const bIndex = standardFolders.findIndex((f) =>
      b.name.toLowerCase().includes(f.toLowerCase())
    );

    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="p-2 space-y-1">
      {sortedFolders.map((folder) => (
        <Button
          key={folder.path}
          variant={selectedFolder === folder.path ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start",
            selectedFolder === folder.path && "bg-muted"
          )}
          onClick={() => onSelect(folder.path)}
        >
          {getFolderIcon(folder.name)}
          <span className="ml-2 truncate">{folder.name}</span>
        </Button>
      ))}
    </div>
  );
}
