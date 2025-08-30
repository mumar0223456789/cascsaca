"use client";

import { cn } from "@/lib/utils";
import { ChatMessage as ChatMessageType } from "@/types/types";

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.sender === "user";

  return (
    <div className={cn("flex w-full", isUser && "justify-end")}>
      <div
        className={cn(
          "px-4 py-2 rounded-lg text-foreground overflow-hidden break-words whitespace-pre-wrap",
          isUser && "max-w-[75%] bg-purple-500 text-white"
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
