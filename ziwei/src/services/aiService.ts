import { isTauri } from '../utils/env';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AstrologyRequestPayload {
  palaceName?: string;
  majorStars?: string;
  minorStars?: string;
  transformations?: string;
  chartContext: string;
  userPrompt: string;
  chatHistory?: ChatMessage[];
  lang: string;
  model: string;
  systemPrompt?: string;
}

export interface StreamCallbacks {
  onChunk: (chunk: string) => void;
}

/**
 * Sends messages to AI and streams response chunks via callbacks.
 * Decouples platform-specific API details (Tauri invoke vs standard Web SSE fetch).
 */
export async function askAiStream(
  messages: ChatMessage[],
  payload: AstrologyRequestPayload,
  callbacks: StreamCallbacks
): Promise<void> {
  if (isTauri()) {
    // Desktop: route via existing Tauri Rust invoke command
    const { invoke } = await import('@tauri-apps/api/core');
    const { listen } = await import('@tauri-apps/api/event');

    // Register a one-time dynamic event listener for Tauri
    const unlisten = await listen<string>('ai-response-chunk', (event) => {
      callbacks.onChunk(event.payload);
    });

    try {
      await invoke('ask_ai', { messages });
    } finally {
      // Clean up event listener when done or on error
      unlisten();
    }
  } else {
    // Web: route via standard HTTP to C# backend (port 5074)
    const backendUrl = '/api/astrology/analyze';

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Response body is not readable');
    }

    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      let lineEnd;
      // Process Server-Sent Events (SSE) data chunks: "data: <content>\n\n"
      while ((lineEnd = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, lineEnd).trim();
        buffer = buffer.slice(lineEnd + 1);

        if (line.startsWith('data: ')) {
          const content = line.slice(6);
          if (content) {
            callbacks.onChunk(content);
          }
        }
      }
    }
  }
}
