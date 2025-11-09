/**
 * Nonefinity Chat Widget
 * Embeddable chat widget component
 */

import React, { useState, useEffect, useRef } from "react";
import { NonefinityClient } from "../client/NonefinityClient";
import type {
  ChatMessage,
  StreamEvent,
  WidgetConfig,
} from "../types";
import "./ChatWidget.css";

interface ToolCall {
  id: string;
  name: string;
  args: Record<string, any>;
  state: "input-streaming" | "input-available" | "output-available" | "output-error";
  content?: string;
}

interface StreamingState {
  content: string;
  tools: Map<string, ToolCall>;
}

export const ChatWidget: React.FC<WidgetConfig> = ({
  sessionId,
  apiUrl,
  apiKey,
  getAuthToken,
  position = "bottom-right",
  primaryColor = "#3b82f6",
  title = "AI Assistant",
  placeholder = "Type your message...",
  className,
  style,
  onError,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [streamingState, setStreamingState] = useState<StreamingState>({
    content: "",
    tools: new Map(),
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<NonefinityClient | null>(null);

  // Initialize client
  useEffect(() => {
    clientRef.current = new NonefinityClient({
      apiUrl,
      apiKey,
      getAuthToken,
      debug: false,
    });
  }, [apiUrl, apiKey, getAuthToken]);

  // Load messages on session change
  useEffect(() => {
    const loadMessages = async () => {
      if (!clientRef.current) return;
      
      const response = await clientRef.current.getSession(sessionId);
      if (response.success && response.data) {
        setMessages(response.data.messages?.chat_messages || []);
      }
    };

    if (sessionId && isOpen) {
      loadMessages();
    }
  }, [sessionId, isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingState, isThinking]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming || !clientRef.current) return;

    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      session_id: sessionId,
      role: "user",
      content: input,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);
    setIsThinking(true);
    setStreamingState({
      content: "",
      tools: new Map(),
    });
    setErrorMessage(null);

    let accumulatedContent = "";
    const accumulatedTools: Array<{
      id: string;
      name: string;
      arguments?: Record<string, any>;
      result?: any;
    }> = [];

    try {
      await clientRef.current.streamMessage(
        sessionId,
        input,
        (event: StreamEvent) => {
          if (event.event === "error") {
            const errorMsg = event.data?.message || "An error occurred";
            setErrorMessage(errorMsg);
            setIsStreaming(false);
            setIsThinking(false);
            if (onError) {
              onError(new Error(errorMsg));
            }
            return;
          }

          if (event.event === "start") {
            setStreamingState({
              content: "",
              tools: new Map(),
            });
            setIsStreaming(true);
            setIsThinking(true);
            return;
          }

          if (event.event === "tool_calls") {
            const payload = event.data as any;
            const toolName = payload?.name || "unknown";
            const args = payload?.arguments || {};
            const incomingId = payload?.id || `${toolName}-${Date.now()}`;

            setIsThinking(false);

            setStreamingState((prev) => {
              const newTools = new Map(prev.tools);
              if (!newTools.has(incomingId)) {
                newTools.set(incomingId, {
                  id: incomingId,
                  name: toolName,
                  args,
                  state: "input-available",
                  content: undefined,
                });
              }
              return { ...prev, tools: newTools };
            });

            accumulatedTools.push({
              id: incomingId,
              name: toolName,
              arguments: args,
            });
          } else if (
            event.event === "tool_result" ||
            event.event === "tool_results"
          ) {
            const payload = event.data as any;
            const toolName = payload?.name || "unknown";
            const toolContent = payload?.result ?? payload?.content ?? "";
            const incomingId = payload?.id as string | undefined;

            setStreamingState((prev) => {
              const newTools = new Map(prev.tools);
              let toolId = incomingId && newTools.has(incomingId) ? incomingId : "";
              
              if (!toolId) {
                for (const [id, tool] of newTools.entries()) {
                  if (tool.name === toolName && tool.state === "input-available") {
                    toolId = id;
                    break;
                  }
                }
              }
              
              if (!toolId) toolId = `${toolName}-${Date.now()}`;

              const existingTool = newTools.get(toolId);
              newTools.set(toolId, {
                id: toolId,
                name: toolName,
                args: existingTool?.args || {},
                content: toolContent,
                state: "output-available",
              });

              return { ...prev, tools: newTools };
            });

            const contentToSave =
              typeof toolContent === "string"
                ? toolContent
                : JSON.stringify(toolContent);

            const idx = accumulatedTools.findIndex((t) =>
              incomingId ? t.id === incomingId : t.name === toolName
            );

            if (idx >= 0) {
              accumulatedTools[idx].result = contentToSave;
            } else {
              accumulatedTools.push({
                id: incomingId || `${toolName}-${Date.now()}`,
                name: toolName,
                result: contentToSave,
              });
            }
          } else if (event.event === "ai_result") {
            const payload = event.data as any;
            const content = payload?.content || "";
            const isDelta = payload?.is_delta === true;

            if (content) {
              setIsThinking(false);

              if (isDelta) {
                accumulatedContent += content;
              } else {
                accumulatedContent = content;
              }

              setStreamingState((prev) => ({
                ...prev,
                content: accumulatedContent,
              }));
            }
          }

          if (event.data?.done === true) {
            setIsStreaming(false);
          }
        }
      );

      if (accumulatedContent) {
        const assistantMessage: ChatMessage = {
          id: `temp-assistant-${Date.now()}`,
          session_id: sessionId,
          role: "assistant",
          content: accumulatedContent,
          tools: accumulatedTools.map((t) => ({
            name: t.name,
            arguments: t.arguments,
            result: t.result,
          })),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Save conversation
        await clientRef.current?.saveConversation(sessionId, {
          messages: [
            {
              role: "user",
              content: userMessage.content,
            },
            {
              role: "assistant",
              content: accumulatedContent,
              tools: accumulatedTools.map((t) => ({
                name: t.name,
                arguments: t.arguments,
                result: t.result,
              })),
            },
          ],
        });
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Failed to send message");
      setErrorMessage(err.message);
      if (onError) {
        onError(err);
      }
    } finally {
      setIsStreaming(false);
      setIsThinking(false);
      setStreamingState({
        content: "",
        tools: new Map(),
      });
    }
  };

  const positionClass = `nonefinity-widget-${position}`;

  const displayMessages = [
    ...messages,
    ...(isStreaming &&
    (streamingState.content || streamingState.tools.size > 0 || isThinking)
      ? [
          {
            id: "streaming",
            session_id: sessionId,
            role: "assistant" as const,
            content: streamingState.content,
            tools: Array.from(streamingState.tools.values()).map((t) => ({
              name: t.name,
              arguments: t.args,
              result: t.content,
            })),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]
      : []),
  ];

  return (
    <div
      className={`nonefinity-widget ${positionClass} ${className || ""}`}
      style={{ ...style, "--primary-color": primaryColor } as React.CSSProperties}
    >
      {/* Toggle Button */}
      {!isOpen && (
        <button
          className="nonefinity-widget-toggle"
          onClick={() => setIsOpen(true)}
          aria-label="Open chat"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="nonefinity-widget-window">
          {/* Header */}
          <div className="nonefinity-widget-header">
            <h3>{title}</h3>
            <button
              className="nonefinity-widget-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="nonefinity-widget-messages">
            {displayMessages.length === 0 ? (
              <div className="nonefinity-widget-empty">
                <p>No messages yet. Start a conversation!</p>
              </div>
            ) : (
              displayMessages.map((msg, idx) => (
                <div
                  key={msg.id || idx}
                  className={`nonefinity-message nonefinity-message-${msg.role}`}
                >
                  <div className="nonefinity-message-content">
                    {msg.content && <p>{msg.content}</p>}
                    {isThinking && msg.id === "streaming" && !msg.content && (
                      <div className="nonefinity-thinking">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="nonefinity-widget-error">{errorMessage}</div>
          )}

          {/* Input */}
          <div className="nonefinity-widget-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder={placeholder}
              disabled={isStreaming}
            />
            <button
              onClick={handleSend}
              disabled={isStreaming || !input.trim()}
              aria-label="Send message"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
