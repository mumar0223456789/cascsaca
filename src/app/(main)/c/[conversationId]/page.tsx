"use client";

import ChatInterface from "@/components/chat/ChatInterface";
import AppSidebar from "@/components/sidebar/AppSidebar";
import { useParams } from "next/navigation";

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.conversationId as string | undefined;

  return (
    <div className="flex h-screen bg-gray-100">
      <AppSidebar />
      <ChatInterface key={conversationId || "new-chat"} conversationId={conversationId} />
    </div>
  );
}
