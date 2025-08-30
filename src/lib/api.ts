import { ChatMessage } from "@/types/types";

interface ResponsePayload {
  content?: string;
  error?: string;
}

export const sendMessage = async function* (
  messages: ChatMessage[],
  timeoutMs = 60000
): AsyncGenerator<string, void, unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch("/api/openrouter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errorData: ResponsePayload = await res.json().catch(() => ({}));
      const errMsg =
        errorData?.error ??
        errorData?.content ??
        `Request failed with status ${res.status}`;
      throw new Error(errMsg);
    }

    if (!res.body) {
      throw new Error("Response body is empty.");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      const chunk = decoder.decode(value, { stream: true });
      if (chunk) {
        yield chunk;
      }
    }
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    console.error("Failed to send message:", err);
    if (err instanceof Error) throw err;
    throw new Error("Failed to get AI response. Please try again.");
  } finally {
    clearTimeout(timeout);
  }
};
