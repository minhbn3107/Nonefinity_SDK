import { useState, useEffect, useRef, useCallback } from "react";
import { NonefinityClient } from "../client/NonefinityClient";
import type { ChatMessage, StreamEvent } from "../types";

interface ToolCall {
    id: string;
    name: string;
    args: Record<string, any>;
    state:
        | "input-streaming"
        | "input-available"
        | "output-available"
        | "output-error";
    content?: string;
}

interface StreamingState {
    content: string;
    tools: Map<string, ToolCall>;
}

interface UseNonefinityChatProps {
    sessionId: string;
    apiUrl?: string;
    apiKey?: string;
    getAuthToken?: () => Promise<string | null> | string | null;
    onError?: (error: Error) => void;
}

const decodeEventPayload = (value: unknown): unknown => {
    if (value === null || value === undefined) {
        return value;
    }

    if (typeof value !== "string") {
        return value;
    }

    let current: unknown = value;
    let attempts = 0;

    while (typeof current === "string" && attempts < 2) {
        const trimmed = current.trim();
        if (!trimmed) {
            return "";
        }

        const firstChar = trimmed[0];
        const lastChar = trimmed[trimmed.length - 1];
        const looksLikeJSON =
            (firstChar === "{" && lastChar === "}") ||
            (firstChar === "[" && lastChar === "]") ||
            (firstChar === '"' && lastChar === '"');

        if (!looksLikeJSON) {
            return trimmed;
        }

        try {
            current = JSON.parse(trimmed);
            attempts += 1;
        } catch {
            return trimmed;
        }
    }

    return current;
};

export const useNonefinityChat = ({
    sessionId,
    apiUrl,
    apiKey,
    getAuthToken,
    onError,
}: UseNonefinityChatProps) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [streamingState, setStreamingState] = useState<StreamingState>({
        content: "",
        tools: new Map(),
    });
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
            if (!clientRef.current || !sessionId) return;

            try {
                const response = await clientRef.current.getSession(sessionId);
                if (response.success && response.data) {
                    setMessages(response.data.messages?.chat_messages || []);
                }
            } catch (err) {
                console.error("Failed to load messages:", err);
            }
        };

        loadMessages();
    }, [sessionId]);

    const sendMessage = useCallback(
        async (messageContent?: string) => {
            const contentToSend = messageContent || input;
            if (!contentToSend.trim() || isStreaming || !clientRef.current)
                return;

            const userMessage: ChatMessage = {
                id: `temp-${Date.now()}`,
                session_id: sessionId,
                role: "user",
                content: contentToSend,
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
                    contentToSend,
                    (event: StreamEvent) => {
                        const payload = decodeEventPayload(event.data);
                        const payloadRecord =
                            typeof payload === "object" && payload !== null
                                ? (payload as Record<string, any>)
                                : undefined;

                        if (event.event === "error") {
                            const errorMsg =
                                typeof payload === "string"
                                    ? payload
                                    : payloadRecord?.message ||
                                      "An error occurred";
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
                            const toolName = payloadRecord?.name || "unknown";
                            const args = payloadRecord?.arguments || {};
                            const incomingId =
                                payloadRecord?.id ||
                                `${toolName}-${Date.now()}`;

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
                            const toolName = payloadRecord?.name || "unknown";
                            const toolContent =
                                payloadRecord?.result ??
                                payloadRecord?.content ??
                                "";
                            const incomingId = payloadRecord?.id as
                                | string
                                | undefined;

                            setStreamingState((prev) => {
                                const newTools = new Map(prev.tools);
                                let toolId =
                                    incomingId && newTools.has(incomingId)
                                        ? incomingId
                                        : "";

                                if (!toolId) {
                                    for (const [
                                        id,
                                        tool,
                                    ] of newTools.entries()) {
                                        if (
                                            tool.name === toolName &&
                                            tool.state === "input-available"
                                        ) {
                                            toolId = id;
                                            break;
                                        }
                                    }
                                }

                                if (!toolId)
                                    toolId = `${toolName}-${Date.now()}`;

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
                                incomingId
                                    ? t.id === incomingId
                                    : t.name === toolName
                            );

                            if (idx >= 0) {
                                accumulatedTools[idx].result = contentToSave;
                            } else {
                                accumulatedTools.push({
                                    id:
                                        incomingId ||
                                        `${toolName}-${Date.now()}`,
                                    name: toolName,
                                    result: contentToSave,
                                });
                            }
                        } else if (event.event === "ai_result") {
                            const content =
                                typeof payload === "string"
                                    ? payload
                                    : payloadRecord?.content || "";
                            const isDelta = payloadRecord?.is_delta === true;

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

                        if (payloadRecord?.done === true) {
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
                                content: contentToSend,
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
                const err =
                    error instanceof Error
                        ? error
                        : new Error("Failed to send message");
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
        },
        [input, isStreaming, sessionId, onError]
    );

    return {
        messages,
        input,
        setInput,
        isStreaming,
        isThinking,
        streamingState,
        errorMessage,
        sendMessage,
    };
};
