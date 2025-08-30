'use client';

import { useConversations } from '@/hooks/conversation/useConversations';
import { MessageSquare, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

export default function Sidebar() {
  const { data: conversations = [] } = useConversations();
  const router = useRouter();
  const params = useParams();
  const currentConversationId = params.conversationId as string;

  const handleNewChat = () => {
    router.push('/');
  };

  return (
    <div className="w-64 bg-gray-900 text-white h-screen flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 rounded-lg py-3 px-4 transition-colors"
        >
          <Plus size={20} />
          New Chat
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {conversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/c/${conversation.id}`}
              className={`block w-full text-left p-3 rounded-lg mb-1 hover:bg-gray-800 transition-colors ${
                currentConversationId === conversation.id ? 'bg-gray-800' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <MessageSquare size={18} />
                <span className="truncate text-sm">{conversation.title}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}