/**
 * Nonefinity Chat Widget
 * Embeddable chat widget component
 */

import React, { useState, useEffect, useRef } from "react";
import { useNonefinityChat } from "../hooks/useNonefinityChat";
import type { WidgetConfig } from "../types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./ChatWidget.css";

export const ChatWidget: React.FC<WidgetConfig> = ({
    sessionId,
    apiUrl,
    apiKey,
    getAuthToken,
    position = "bottom-right",
    primaryColor,
    title = "AI Assistant",
    placeholder = "Type your message...",
    className,
    style,
    theme,
    onError,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const {
        messages,
        input,
        setInput,
        isStreaming,
        isThinking,
        streamingState,
        errorMessage,
        sendMessage,
    } = useNonefinityChat({
        sessionId,
        apiUrl,
        apiKey,
        getAuthToken,
        onError,
    });

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, streamingState, isThinking]);

    const handleSend = () => {
        sendMessage();
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
                      tools: Array.from(streamingState.tools.values()).map(
                          (t) => ({
                              name: t.name,
                              arguments: t.args,
                              result: t.content,
                          })
                      ),
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                  },
              ]
            : []),
    ];

    // Theme variables
    const themeStyles = {
        "--primary-color": theme?.primaryColor || primaryColor || "#3b82f6",
        "--background-color":
            theme?.backgroundColor ||
            (theme?.mode === "dark" ? "#1f2937" : "#ffffff"),
        "--text-color":
            theme?.textColor ||
            (theme?.mode === "dark" ? "#f3f4f6" : "#111827"),
        "--font-size": theme?.fontSize || "14px",
        "--font-family": theme?.fontFamily || "inherit",
        "--border-radius": theme?.borderRadius || "12px",
        "--widget-width": theme?.width || "400px",
        "--widget-height": theme?.height || "650px",
        ...style,
    } as React.CSSProperties;

    const themeClass =
        theme?.mode === "dark"
            ? "nonefinity-theme-dark"
            : "nonefinity-theme-light";

    return (
        <div
            className={`nonefinity-widget ${positionClass} ${themeClass} ${
                className || ""
            }`}
            style={themeStyles}
        >
            {/* Toggle Button */}
            {!isOpen && (
                <button
                    className="nonefinity-widget-toggle"
                    onClick={() => setIsOpen(true)}
                    aria-label="Open chat"
                    aria-expanded="false"
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
                                        {msg.content &&
                                            (msg.role === "assistant" ? (
                                                <div className="nonefinity-markdown">
                                                    <ReactMarkdown
                                                        remarkPlugins={[
                                                            remarkGfm,
                                                        ]}
                                                    >
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                </div>
                                            ) : (
                                                <p>{msg.content}</p>
                                            ))}
                                        {isThinking &&
                                            msg.id === "streaming" &&
                                            !msg.content && (
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
                        <div className="nonefinity-widget-error">
                            {errorMessage}
                        </div>
                    )}

                    {/* Input */}
                    <div className="nonefinity-widget-input">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) =>
                                e.key === "Enter" && handleSend()
                            }
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
