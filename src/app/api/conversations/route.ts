import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Conversation } from "@/types/types";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, title } = await request.json();
    if (!id || !title) {
      return NextResponse.json(
        { error: "ID and title are required" },
        { status: 400 }
      );
    }

    const newConversation = await prisma.conversation.create({
      data: {
        id: id,
        userId: user.id,
        title: title || "New Conversation",
      },
    });

    const formattedConversation: Conversation = {
      id: newConversation.id,
      userId: newConversation.userId,
      title: newConversation.title,
      created_at: newConversation.created_at.toISOString(),
    };

    return NextResponse.json(formattedConversation, { status: 201 });
  } catch (error) {
    console.error("API Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
      where: { userId: user.id },
      orderBy: { created_at: "desc" },
    });

    const formattedConversations: Conversation[] = conversations.map(
      (conv) => ({
        id: conv.id,
        userId: conv.userId,
        title: conv.title,
        created_at: conv.created_at.toISOString(),
      })
    );

    return NextResponse.json(formattedConversations, { status: 200 });
  } catch (error) {
    console.error("API Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}
