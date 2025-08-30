import { streamText, ModelMessage } from "ai";
import { openrouter, OPENROUTER_MODELS } from "./openrouter";

function determineModelForPrompt(prompt: string): string {
  const lowerCasePrompt = prompt.toLowerCase().trim();

  if (
    lowerCasePrompt.length < 20 ||
    ["hi", "hello", "hey", "thanks", "thank you", "bye", "goodbye"].some(
      (keyword) => lowerCasePrompt.includes(keyword)
    )
  ) {
    console.log("Using LITE_MODEL for simple prompt.");
    return OPENROUTER_MODELS.LITE_MODEL;
  }

  if (
    lowerCasePrompt.length > 100 ||
    lowerCasePrompt.includes("how to") ||
    lowerCasePrompt.includes("what is") ||
    lowerCasePrompt.includes("explain")
  ) {
    console.log("Using HEAVY_QWEN2_72B for complex prompt.");
    return OPENROUTER_MODELS.HEAVY_QWEN2_72B;
  }

  console.log("Using BALANCED_MISTRAL_7B for general prompt.");
  return OPENROUTER_MODELS.BALANCED_MISTRAL_7B;
}

export async function* generateResponse(
  prompt: string,
  conversationHistory: Array<{ sender: string; content: string }> = []
): AsyncIterable<string> {
  try {
    const selectedModel = "meta-llama/llama-3.3-8b-instruct:free";
    //const selectedModel = determineModelForPrompt(prompt);

    const messages: ModelMessage[] = conversationHistory.map((msg) => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.content,
    }));

    messages.push({ role: "user", content: prompt });

    const result = await streamText({
      model: openrouter.chat(selectedModel),
      messages: messages,
      temperature: 0.7,
      maxOutputTokens: 1024,
    });

    for await (const textPart of result.textStream) {
      yield textPart;
    }
  } catch (error) {
    console.error("AI Service Error generating response:", error);
    throw new Error("Failed to generate AI response");
  }
}

export async function generateChatTitle(
  firstUserMessage: string
): Promise<string> {
  try {
    const titleModel = OPENROUTER_MODELS.LITE_MODEL;
    console.log(`Generating title with model: ${titleModel}`);

    const prompt = `You are a helpful assistant that generates concise, creative, and unique titles for chat conversations.
    Based on the following user's first message, provide a short title (max 5-7 words) that hints at the conversation's potential topic or is a creative take on the initial interaction.
    Do not include any conversational phrases or greetings, just the title.

    User message: '${firstUserMessage}'

    Title:`;

    const result = await streamText({
      model: openrouter.chat(titleModel),
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      maxOutputTokens: 50,
    });

    let title = "";
    for await (const textPart of result.textStream) {
      title += textPart;
    }
    title = title.trim();

    if (title.startsWith('"') && title.endsWith('"')) {
      title = title.substring(1, title.length - 1);
    }

    const words = title.split(/\s+/);
    if (words.length > 7) {
      title = words.slice(0, 7).join(" ") + "...";
    }

    return title;
  } catch (error) {
    console.error("AI Service Error generating chat title:", error);
    throw new Error("Failed to generate AI chat title");
  }
}
