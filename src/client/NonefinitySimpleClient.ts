/**
 * Nonefinity AI Simple SDK Client
 * Simplified client with auto-session management for easy integration
 */

export interface NonefinitySimpleConfig {
  /** Chat configuration ID */
  chatConfigId: string;
  /** API key for authentication */
  apiKey: string;
  /** Session handling: "auto" generates a session, or provide a function to create custom session names */
  session?: "auto" | (() => string);
  /** API base URL (default: http://localhost:8000) */
  apiUrl?: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  models?: Record<string, any>;
  tools?: Record<string, any>;
  interrupt?: Record<string, any>;
}

export interface StreamEvent {
  event: string;
  data: any;
}

export interface ChatResponse {
  /** Full response text (only available for non-streaming) */
  text?: string;
  /** Session ID for this conversation */
  sessionId: string;
}

export class NonefinitySimpleClient {
  private config: Required<NonefinitySimpleConfig>;
  private sessionId: string | null = null;
  private readonly SESSION_STORAGE_KEY = "nonefinity_session_id";

  constructor(config: NonefinitySimpleConfig) {
    this.config = {
      chatConfigId: config.chatConfigId,
      apiKey: config.apiKey,
      session: config.session || "auto",
      apiUrl: config.apiUrl || "http://localhost:8000",
    };

    // Try to restore session from localStorage (browser only)
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      const savedSession = this.loadSessionId();
      if (savedSession) {
        this.sessionId = savedSession;
      }
    }
  }

  /**
   * Create a new chat session
   * @returns The created session ID
   */
  async createSession(): Promise<string> {
    const sessionName =
      this.config.session === "auto"
        ? this.generateSessionName()
        : this.config.session();

    const response = await fetch(
      `${this.config.apiUrl}/api/v1/chats/sessions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          chat_config_id: this.config.chatConfigId,
          name: sessionName,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create session: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    // Handle different response formats
    this.sessionId = data.id || data.session_id || data.data?.id || data.data?.session_id;
    
    if (!this.sessionId) {
      throw new Error(`No session ID in response: ${JSON.stringify(data)}`);
    }

    // Save to localStorage
    this.saveSessionId(this.sessionId);

    return this.sessionId;
  }

  /**
   * Send a chat message (SSE streaming)
   * @param question The question/message to send
   * @param onEvent Callback for streaming events
   * @returns Promise with the session ID
   */
  async chat(
    question: string,
    onEvent: (event: StreamEvent) => void
  ): Promise<{ sessionId: string }> {
    return new Promise((resolve, reject) => {
      // Ensure we have a session
      if (!this.sessionId) {
        this.createSession()
          .then(() => this.streamChat(question, onEvent))
          .then(() => resolve({ sessionId: this.sessionId! }))
          .catch(reject);
      } else {
        this.streamChat(question, onEvent)
          .then(() => resolve({ sessionId: this.sessionId! }))
          .catch(reject);
      }
    });
  }

  /**
   * Send a chat message with streaming response
   * @param question The question/message to send
   * @param onEvent Callback for streaming events
   */
  async streamChat(
    question: string,
    onEvent: (event: StreamEvent) => void
  ): Promise<void> {
    if (!this.sessionId) {
      throw new Error("No active session. Call createSession() or chat() first.");
    }

    try {
      const response = await fetch(
        `${this.config.apiUrl}/api/v1/chats/sessions/${this.sessionId}/stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify({
            role: "user",
            content: question,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Chat request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim()) {
            this.processSSELine(line, onEvent);
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        this.processSSEBuffer(buffer, onEvent);
      }
    } catch (error) {
      onEvent({
        event: "error",
        data: {
          message: error instanceof Error ? error.message : "Unknown error",
        },
      });
      throw error;
    }
  }

  /**
   * Send a chat message and wait for complete response (non-streaming)
   * @param question The question/message to send
   * @returns Promise with the complete response
   */
  async chatComplete(question: string): Promise<ChatResponse> {
    let fullResponse = "";

    await this.chat(question, (event) => {
      if (event.event === "message" && event.data.content) {
        fullResponse += event.data.content;
      }
    });

    return {
      text: fullResponse,
      sessionId: this.sessionId!,
    };
  }

  /**
   * Get the current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Clear the current session
   */
  clearSession(): void {
    this.sessionId = null;
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      localStorage.removeItem(this.SESSION_STORAGE_KEY);
    }
  }

  /**
   * Set a specific session ID (useful for resuming sessions)
   */
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
    this.saveSessionId(sessionId);
  }

  /**
   * Save session ID to localStorage (browser only)
   */
  private saveSessionId(sessionId: string): void {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      localStorage.setItem(this.SESSION_STORAGE_KEY, sessionId);
    }
  }

  /**
   * Load session ID from localStorage (browser only)
   */
  private loadSessionId(): string | null {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      return localStorage.getItem(this.SESSION_STORAGE_KEY);
    }
    return null;
  }

  private generateSessionName(): string {
    const timestamp = new Date().toISOString().split("T")[0];
    const random = Math.random().toString(36).substring(2, 8);
    return `session-${timestamp}-${random}`;
  }

  private processSSELine(
    line: string,
    onEvent: (event: StreamEvent) => void
  ): void {
    const eventMatch = line.match(/^event: (.+)$/m);
    const dataMatch = line.match(/^data: (.+)$/m);

    if (eventMatch || dataMatch) {
      let eventType = eventMatch ? eventMatch[1] : "message";
      const dataStr = dataMatch ? dataMatch[1] : "{}";

      // Normalize ai_result to message for consistency
      if (eventType === "ai_result") {
        eventType = "message";
      }

      try {
        // Handle special markers
        if (dataStr.trim() === '"[START]"') {
          onEvent({ event: "start", data: {} });
          return;
        }
        if (dataStr.trim() === '"[END]"') {
          onEvent({ event: eventType, data: { done: true } });
          return;
        }

        let data = JSON.parse(dataStr);
        
        // Sometimes data is double-encoded (string within string)
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (e) {
            // If second parse fails, keep as string
          }
        }
        
        // Extract content from various possible structures
        let content = null;
        
        // Format 1: Direct content field {content: '...', role: '...'}
        if (data.content) {
          content = data.content;
        }
        // Format 2: Nested in model.messages {model: {messages: [AIMessage(content='...', ...)]}}
        else if (data.model?.messages && Array.isArray(data.model.messages)) {
          const lastMessage = data.model.messages[data.model.messages.length - 1];
          if (lastMessage?.content) {
            content = lastMessage.content;
          }
        }
        
        // Send event with extracted content
        if (content) {
          onEvent({ event: eventType, data: { content, raw: data } });
        } else {
          onEvent({ event: eventType, data });
        }
      } catch (e) {
        onEvent({
          event: eventType,
          data: { raw: dataStr, parseError: String(e) },
        });
      }
    }
  }

  private processSSEBuffer(
    buffer: string,
    onEvent: (event: StreamEvent) => void
  ): void {
    const lines = buffer.split("\n\n").filter((line) => line.trim());
    for (const line of lines) {
      this.processSSELine(line, onEvent);
    }
  }
}
