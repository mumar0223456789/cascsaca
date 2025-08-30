'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSaveMessage } from './conversation/useConversations';
import { ChatMessage } from '@/types/types';
import { sendMessage } from '@/lib/api';

export const useChat = () => {
  const saveMessage = useSaveMessage();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      messages,
      pendingMessageId
    }: {
      conversationId: string;
      messages: ChatMessage[];
      pendingMessageId: string;
    }) => {
      let fullAiResponseContent = "";

      try {
        for await (const chunk of sendMessage(messages)) {
          fullAiResponseContent += chunk;

          queryClient.setQueryData(
            ['messages', conversationId],
            (oldMessages: ChatMessage[] | undefined) => {
              if (!oldMessages) return [];

              const updatedMessages = oldMessages.map((msg) =>
                msg.id === pendingMessageId
                  ? { ...msg, content: fullAiResponseContent }
                  : msg
              );
              return updatedMessages;
            }
          );
        }

        const assistantMessage: ChatMessage = {
          id: pendingMessageId,
          sender: 'ai',
          content: fullAiResponseContent,
          created_at: new Date().toISOString(),
          userId: messages[0]?.userId || 'placeholder-user-id',
          conversationId,
        };

        await saveMessage.mutateAsync(assistantMessage);

        return assistantMessage;
      } catch (error) {
        console.error('Chat API error:', error);
        const errorMessageContent = 'Sorry, I encountered an error. Please make sure your API key is set correctly in the environment variables.';
        const errorMessage: ChatMessage = {
          id: pendingMessageId,
          sender: 'ai',
          content: errorMessageContent,
          created_at: new Date().toISOString(),
          userId: messages[0]?.userId || 'placeholder-user-id',
          conversationId,
        };

        queryClient.setQueryData(
          ['messages', conversationId],
          (oldMessages: ChatMessage[] | undefined) => {
            if (!oldMessages) return [];
            return oldMessages.map((msg) =>
              msg.id === pendingMessageId
                ? { ...msg, content: errorMessageContent }
                : msg
            );
          }
        );

        await saveMessage.mutateAsync(errorMessage);
        throw error;
      }
    },
  });
};
