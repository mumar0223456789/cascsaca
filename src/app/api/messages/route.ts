import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChatMessage } from "@/types/types";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId, content, sender } = await request.json();

    if (!conversationId || !content || !sender) {
      return NextResponse.json(
        { error: "Missing required message fields" },
        { status: 400 }
      );
    }

    const newMessage = await prisma.message.create({
      data: {
        userId: user.id,
        conversationId: conversationId,
        content: content,
        sender: sender,
      },
    });

    const formattedMessage: ChatMessage = {
      id: newMessage.id,
      conversationId: newMessage.conversationId,
      content: newMessage.content,
      sender: newMessage.sender as "user" | "ai",
      created_at: newMessage.created_at.toISOString(),
      userId: newMessage.userId,
    };

    return NextResponse.json(formattedMessage, { status: 201 });
  } catch (error) {
    console.error("API Error saving message:", error);
    return NextResponse.json(
      { error: "Failed to save message" },
      { status: 500 }
    );
  }
}
