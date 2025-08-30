import { NextRequest, NextResponse } from "next/server";
import { ChatMessage } from "@/types/types";
import { generateResponse } from "@/lib/ai-models/aiService";

export async function POST(request: NextRequest) {
  try {
    const { messages }: { messages: ChatMessage[] } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "No messages provided" },
        { status: 400 }
      );
    }

    // Extract latest user message
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage.sender !== "user") {
      return NextResponse.json(
        { error: "Last message must be from the user" },
        { status: 400 }
      );
    }

    // Format conversation history for the AI service
    const conversationHistory = messages.slice(0, -1).map((msg) => ({
      sender: msg.sender,
      content: msg.content,
    }));

    // Create a ReadableStream to stream the AI response
    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of generateResponse(
            lastUserMessage.content,
            conversationHistory
          )) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch (error) {
          console.error("Error during AI response streaming:", error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain", // Or 'text/event-stream' if you want to use SSE
      },
    });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
