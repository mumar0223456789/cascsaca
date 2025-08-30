export type UserData = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  isEmailVerified: boolean;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  content: string;
  userId: string;
  sender: "user" | "ai";
  created_at: string;
  conversationId: string;
};

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  created_at: string;
  updated_at?: string;
  isTitleGenerating?: boolean;
}

export type StreamEventType = 'initial' | 'message' | 'done' | 'error' | 'titleUpdate';

export interface StreamEventData {
  conversationId?: string;
  userMessage?: ChatMessage;
  chunk?: string;
  id?: string; // For assistant message ID
  content?: string; // For error messages
  assistantMessage?: ChatMessage;
  newTitle?: string; // For title updates
}
