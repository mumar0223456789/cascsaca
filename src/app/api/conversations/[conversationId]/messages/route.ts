import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChatMessage } from "@/types/types";

export async function GET({ params }: { params: { conversationId: string } }) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = params;
    const messages = await prisma.message.findMany({
      where: { conversationId: conversationId, userId: user.id },
      orderBy: { created_at: "asc" },
    });

    const formattedMessages: ChatMessage[] = messages.map((msg) => ({
      id: msg.id,
      conversationId: msg.conversationId,
      content: msg.content,
      sender: msg.sender as "user" | "ai",
      created_at: msg.created_at.toISOString(),
      userId: msg.userId,
    }));

    return NextResponse.json(formattedMessages, { status: 200 });
  } catch (error) {
    console.error("API Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
