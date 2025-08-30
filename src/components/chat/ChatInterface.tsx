"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useChat } from "@/hooks/useChat";
import { v4 as uuidv4 } from "uuid";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { ChatMessage as Message } from "@/types/types";
import {
  useCreateConversation,
  useMessages,
  useSaveMessage,
  useUpdateConversation,
} from "@/hooks/conversation/useConversations";
import Navbar from "../Navbar";
import { SidebarTrigger } from "../ui/sidebar";

interface ChatInterfaceProps {
  conversationId?: string;
}

export default function ChatInterface({ conversationId }: ChatInterfaceProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);

  const userId = "placeholder-user-id";

  const { data: fetchedMessages = [] } = useMessages(conversationId || null);
  const createConversation = useCreateConversation();
  const saveMessage = useSaveMessage();
  const updateConversation = useUpdateConversation();
  const chat = useChat();

  // Use optimistic messages for new conversations, fetched messages for existing ones
  const displayMessages = conversationId ? fetchedMessages : optimisticMessages;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages]);

  const handleSendMessage = async (content: string) => {
    const now = new Date().toISOString();

    if (!conversationId) {
      // Creating a new conversation with optimistic UI
      const tempConversationId = uuidv4();

      const userMessage: Message = {
        id: uuidv4(),
        sender: "user",
        content,
        created_at: now,
        userId,
        conversationId: tempConversationId,
      };

      const pendingAssistantMessage: Message = {
        id: uuidv4(),
        sender: "ai",
        content: "Thinking...",
        created_at: now,
        userId,
        conversationId: tempConversationId,
      };

      // Immediately show messages optimistically
      setOptimisticMessages([userMessage, pendingAssistantMessage]);

      try {
        // Create conversation with user message
        const result = await createConversation.mutateAsync({
          userId,
          firstMessage: content,
        });

        const actualConversationId = result.conversationId;

        // Update message conversation IDs to match the created conversation
        const updatedUserMessage = {
          ...userMessage,
          conversationId: actualConversationId,
        };
        const updatedPendingMessage = {
          ...pendingAssistantMessage,
          conversationId: actualConversationId,
        };

        // Pre-populate the cache for the actual conversation ID
        queryClient.setQueryData(
          ["messages", actualConversationId],
          [updatedUserMessage, updatedPendingMessage]
        );

        // Navigate to the new conversation (no flicker since ChatInterface doesn't remount)
        router.push(`/c/${actualConversationId}`);

        // TODO: Remove local storage calls when database is integrated
        // Save pending assistant message to local storage
        await saveMessage.mutateAsync(updatedPendingMessage);

        // Start AI response
        chat.mutate({
          conversationId: actualConversationId,
          messages: [updatedUserMessage],
          pendingMessageId: updatedPendingMessage.id,
        });
      } catch (error) {
        console.error("Failed to create conversation:", error);
        // Reset optimistic state on error
        setOptimisticMessages([]);
      }
    } else if (conversationId) {
      // Adding message to existing conversation
      const userMessage: Message = {
        id: uuidv4(),
        sender: "user",
        content,
        created_at: now,
        userId,
        conversationId,
      };

      const pendingAssistantMessage: Message = {
        id: uuidv4(),
        sender: "ai",
        content: "Thinking...",
        created_at: now,
        userId,
        conversationId,
      };

      try {
        // TODO: Remove local storage calls when database is integrated
        // Save user message to local storage
        await saveMessage.mutateAsync(userMessage);
        // Save pending assistant message to local storage
        await saveMessage.mutateAsync(pendingAssistantMessage);

        // Update conversation timestamp
        await updateConversation.mutateAsync({ conversationId });

        // Get all messages for AI context (excluding pending messages)
        const allMessages = queryClient.getQueryData([
          "messages",
          conversationId,
        ]) as Message[];
        const contextMessages = allMessages.filter(
          (msg: Message) =>
            msg.sender === "user" ||
            (msg.sender === "ai" && msg.content !== "Thinking...")
        );

        // Start AI response
        chat.mutate({
          conversationId,
          messages: [...contextMessages, userMessage],
          pendingMessageId: pendingAssistantMessage.id,
        });
      } catch (error) {
        console.error("Failed to add message:", error);
      }
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {displayMessages.length === 0 ? (
        <div className="relative w-full h-full">
          <div className="absolute top-3 left-3">
            <SidebarTrigger />
          </div>
          <div className="h-full w-full flex-1 flex flex-col items-center justify-center gap-6">
            <span className="select-none text-5xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">
              Reseach-o-Bot
            </span>
            <div className="w-full max-w-4xl px-4">
              <ChatInput
                onSend={handleSendMessage}
                disabled={chat.isPending || createConversation.isPending}
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 flex flex-col overflow-y-auto">
            <Navbar />
            <div className="w-full flex flex-col items-center py-2 gap-7">
              {displayMessages.map((message) => (
                <div key={message.id} className="flex w-full max-w-4xl">
                  <ChatMessage message={message} />
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
          <div className="w-full max-w-4xl px-4 mx-auto">
            <ChatInput
              onSend={handleSendMessage}
              disabled={chat.isPending || createConversation.isPending}
            />
          </div>
        </>
      )}
    </div>
  );
}
