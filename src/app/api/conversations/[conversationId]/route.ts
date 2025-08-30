import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Conversation } from '@/types/types';

export async function GET({ params }: { params: { conversationId: string } }) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = params;
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
        userId: user.id
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const formattedConversation: Conversation = {
      id: conversation.id,
      userId: conversation.userId,
      title: conversation.title,
      created_at: conversation.created_at.toISOString(),
    };

    return NextResponse.json(formattedConversation, { status: 200 });
  } catch (error) {
    console.error('API Error fetching single conversation:', error);
    return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { conversationId: string } }) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = params;
    const { title } = await request.json(); // title can be undefined

    // Verify ownership before updating
    const existingConversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!existingConversation || existingConversation.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to update this conversation' }, { status: 403 });
    }

    const updateData: { title?: string } = {};
    if (title !== undefined) { // Only update title if provided
      updateData.title = title;
    }

    // Update conversation. The @updatedAt decorator in Prisma schema will automatically update the timestamp.
    await prisma.conversation.update({
      where: { id: conversationId },
      data: updateData // This will trigger @updatedAt even if updateData is empty
    });

    return NextResponse.json({ message: 'Conversation updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('API Error updating conversation:', error);
    return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 });
  }
}
