"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";
import { ChatMessage, Conversation } from "@/types/types";
import { useUser } from "@/context/UserContext";
import axios from "@/lib/axios";
import { generateChatTitle } from "@/lib/ai-models/aiService";

const CONVERSATIONS_KEY = "conversations";
const CONVERSATION_KEY = "conversation";
const MESSAGES_KEY_PREFIX = "messages";

export const useConversations = () => {
  const { user } = useUser();
  return useQuery({
    queryKey: [CONVERSATIONS_KEY, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await axios.get<Conversation[]>("/api/conversations");
      return response.data;
    },
    enabled: !!user?.id,
  });
};

export const useConversation = (id: string | null) => {
  const { user } = useUser();
  return useQuery({
    queryKey: [CONVERSATION_KEY, id, user?.id],
    queryFn: async () => {
      if (!id || !user?.id) return null;
      const response = await axios.get<Conversation>(
        `/api/conversations/${id}`
      );
      return response.data;
    },
    enabled: !!id && !!user?.id,
  });
};

export const useMessages = (conversationId: string | null) => {
  const { user } = useUser();
  return useQuery({
    queryKey: [MESSAGES_KEY_PREFIX, conversationId, user?.id],
    queryFn: async () => {
      if (!conversationId || !user?.id) return [];
      const response = await axios.get<ChatMessage[]>(
        `/api/conversations/${conversationId}/messages`
      );
      return response.data;
    },
    enabled: !!conversationId && !!user?.id,
    initialData: [],
  });
};

export const useCreateConversation = () => {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({
      firstMessage,
    }: {
      firstMessage: string;
    }): Promise<{ conversationId: string; conversation: Conversation }> => {
      if (!user?.id) {
        throw new Error("User not authenticated.");
      }

      const newConversationId = uuidv4();

      const newConversation: Conversation = {
        id: newConversationId,
        userId: user.id,
        title: "New Chat",
        created_at: new Date().toISOString(),
        isTitleGenerating: true,
      };

      queryClient.setQueryData(
        [CONVERSATIONS_KEY, user.id],
        (oldConversations: Conversation[] | undefined) => {
          return [newConversation, ...(oldConversations || [])];
        }
      );

      const createResponse = await axios.post<Conversation>(
        "/api/conversations",
        { id: newConversation.id, title: newConversation.title }
      );
      const createdConversation = createResponse.data;

      newConversation.id = createdConversation.id;

      const userMessage: ChatMessage = {
        id: uuidv4(),
        sender: "user",
        content: firstMessage,
        created_at: new Date().toISOString(),
        userId: user.id,
        conversationId: newConversation.id,
      };
      await axios.post("/api/messages", userMessage);

      queryClient.setQueryData(
        [MESSAGES_KEY_PREFIX, newConversation.id, user.id],
        [userMessage]
      );

      generateChatTitle(firstMessage)
        .then(async (generatedTitle) => {
          await axios.put(`/api/conversations/${newConversation.id}`, {
            title: generatedTitle,
          });

          queryClient.setQueryData(
            [CONVERSATIONS_KEY, user.id],
            (oldConversations: Conversation[] | undefined) => {
              return (oldConversations || []).map((conv) =>
                conv.id === newConversation.id
                  ? { ...conv, title: generatedTitle, isTitleGenerating: false }
                  : conv
              );
            }
          );
          queryClient.setQueryData(
            [CONVERSATION_KEY, newConversation.id, user.id],
            (oldConv: Conversation | undefined) =>
              oldConv
                ? {
                    ...oldConv,
                    title: generatedTitle,
                    isTitleGenerating: false,
                  }
                : oldConv
          );
        })
        .catch((error) => {
          console.error("Failed to generate chat title:", error);
          queryClient.setQueryData(
            [CONVERSATIONS_KEY, user.id],
            (oldConversations: Conversation[] | undefined) => {
              return (oldConversations || []).map((conv) =>
                conv.id === newConversation.id
                  ? { ...conv, isTitleGenerating: false }
                  : conv
              );
            }
          );
          queryClient.setQueryData(
            [CONVERSATION_KEY, newConversation.id, user.id],
            (oldConv: Conversation | undefined) =>
              oldConv ? { ...oldConv, isTitleGenerating: false } : oldConv
          );
        });

      return {
        conversationId: newConversation.id,
        conversation: newConversation,
      };
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [CONVERSATIONS_KEY, user?.id],
      });
    },
  });
};

export const useSaveMessage = () => {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (message: ChatMessage) => {
      if (!user?.id) {
        throw new Error("User not authenticated.");
      }
      const messageToSave = { ...message, userId: user.id };

      queryClient.setQueryData(
        [MESSAGES_KEY_PREFIX, message.conversationId, user.id],
        (oldMessages: ChatMessage[] | undefined) => {
          const existingMessageIndex = (oldMessages || []).findIndex(
            (msg) => msg.id === message.id
          );
          if (existingMessageIndex !== -1) {
            const updatedMessages = [...(oldMessages || [])];
            updatedMessages[existingMessageIndex] = messageToSave;
            return updatedMessages;
          } else {
            return [...(oldMessages || []), messageToSave];
          }
        }
      );

      const response = await axios.post<ChatMessage>(
        "/api/messages",
        messageToSave
      );
      const savedMessage = response.data;

      queryClient.invalidateQueries({
        queryKey: [MESSAGES_KEY_PREFIX, message.conversationId, user.id],
      });

      return savedMessage;
    },
  });
};

export const useUpdateConversation = () => {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({ conversationId }: { conversationId: string }) => {
      if (!user?.id) {
        throw new Error("User not authenticated.");
      }

      await axios.put(`/api/conversations/${conversationId}`, {});

      queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_KEY, user.id] });
      queryClient.invalidateQueries({
        queryKey: [CONVERSATION_KEY, conversationId, user.id],
      });

      return { conversationId };
    },
  });
};
