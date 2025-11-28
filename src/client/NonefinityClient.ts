/**
 * Nonefinity AI SDK Client
 * Core client for interacting with Nonefinity AI API
 */

import type {
    ApiResponse,
    ChatConfig,
    ChatConfigCreate,
    ChatConfigUpdate,
    ChatConfigListResponse,
    ChatSession,
    ChatSessionCreate,
    ChatSessionListResponse,
    NonefinityConfig,
    SaveConversationRequest,
    StreamEvent,
    APIKeyCreate,
    APIKeyResponse,
    APIKeyCreateResponse,
    APIKeyListResponse,
    APIKeyUpdate,
} from "../types";
import { getDefaultApiUrl } from "../types";

export class NonefinityClient {
    private apiUrl: string;
    private apiKey?: string;
    private getAuthToken?: () => Promise<string | null> | string | null;
    private debug: boolean;

    constructor(config: NonefinityConfig) {
        const fallback =
            typeof getDefaultApiUrl === "function"
                ? getDefaultApiUrl()
                : "https://api.nonefinity.com/api/v1";

        const rawUrl = config.apiUrl ?? fallback;

        this.apiUrl = (rawUrl || "https://api.nonefinity.com/api/v1").replace(
            /\/$/,
            ""
        ); // Remove trailing slash
        this.apiKey = config.apiKey;
        this.getAuthToken = config.getAuthToken;
        this.debug = config.debug || false;
    }

    /**
     * Get authorization token
     */
    private async getToken(): Promise<string | null> {
        if (this.apiKey) {
            return this.apiKey;
        }
        if (this.getAuthToken) {
            return await Promise.resolve(this.getAuthToken());
        }
        return null;
    }

    /**
     * Make HTTP request
     */
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        try {
            const token = await this.getToken();
            const headers: Record<string, string> = {
                "Content-Type": "application/json",
                ...(options.headers as Record<string, string>),
            };

            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }

            const url = `${this.apiUrl}${endpoint}`;
            if (this.debug) {
                console.log(
                    `[NonefinityClient] Request: ${
                        options.method || "GET"
                    } ${url}`
                );
            }

            const response = await fetch(url, {
                ...options,
                headers,
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: data.message || data.detail || "Request failed",
                    data: undefined,
                };
            }

            // Handle different response formats
            if (data.success !== undefined) {
                return data;
            } else if (data.data !== undefined) {
                return {
                    success: true,
                    data: data.data,
                    message: data.message,
                };
            } else {
                return {
                    success: true,
                    data: data,
                };
            }
        } catch (error) {
            if (this.debug) {
                console.error("[NonefinityClient] Request error:", error);
            }
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
                data: undefined,
            };
        }
    }

    // ==================== Chat Config Methods ====================

    /**
     * List all chat configurations
     */
    async listConfigs(
        skip: number = 0,
        limit: number = 100
    ): Promise<ApiResponse<ChatConfigListResponse>> {
        return this.request<ChatConfigListResponse>(
            `/chats/configs?skip=${skip}&limit=${limit}`
        );
    }

    /**
     * Get a specific chat configuration
     */
    async getConfig(id: string): Promise<ApiResponse<ChatConfig>> {
        return this.request<ChatConfig>(`/chats/configs/${id}`);
    }

    /**
     * Create a new chat configuration
     */
    async createConfig(
        data: ChatConfigCreate
    ): Promise<ApiResponse<ChatConfig>> {
        return this.request<ChatConfig>("/chats/configs", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }

    /**
     * Update a chat configuration
     */
    async updateConfig(
        id: string,
        data: ChatConfigUpdate
    ): Promise<ApiResponse<ChatConfig>> {
        return this.request<ChatConfig>(`/chats/configs/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    }

    /**
     * Delete a chat configuration
     */
    async deleteConfig(id: string): Promise<ApiResponse<void>> {
        return this.request<void>(`/chats/configs/${id}`, {
            method: "DELETE",
        });
    }

    // ==================== Chat Session Methods ====================

    /**
     * List all chat sessions
     */
    async listSessions(
        skip: number = 0,
        limit: number = 100
    ): Promise<ApiResponse<ChatSessionListResponse>> {
        return this.request<ChatSessionListResponse>(
            `/chats/sessions?skip=${skip}&limit=${limit}`
        );
    }

    /**
     * Get a specific chat session with messages
     */
    async getSession(
        id: string,
        skip: number = 0,
        limit: number = 100
    ): Promise<ApiResponse<ChatSession>> {
        return this.request<ChatSession>(
            `/chats/sessions/${id}?skip=${skip}&limit=${limit}`
        );
    }

    /**
     * Create a new chat session
     */
    async createSession(
        data: ChatSessionCreate
    ): Promise<ApiResponse<ChatSession>> {
        return this.request<ChatSession>("/chats/sessions", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }

    /**
     * Delete a chat session
     */
    async deleteSession(id: string): Promise<ApiResponse<void>> {
        return this.request<void>(`/chats/sessions/${id}`, {
            method: "DELETE",
        });
    }

    /**
     * Clear all messages in a chat session
     */
    async clearSessionMessages(id: string): Promise<ApiResponse<void>> {
        return this.request<void>(`/chats/sessions/${id}/messages`, {
            method: "DELETE",
        });
    }

    // ==================== Chat Streaming Methods ====================

    /**
     * Stream chat messages using Server-Sent Events (SSE)
     */
    async streamMessage(
        sessionId: string,
        message: string,
        onEvent: (event: StreamEvent) => void
    ): Promise<void> {
        try {
            const token = await this.getToken();
            const headers: Record<string, string> = {
                "Content-Type": "application/json",
            };

            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }

            const url = `${this.apiUrl}/chats/sessions/${sessionId}/stream`;
            if (this.debug) {
                console.log(`[NonefinityClient] Stream: POST ${url}`);
            }

            const response = await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    role: "user",
                    content: message,
                }),
            });

            if (!response.ok) {
                const errorText = await response
                    .text()
                    .catch(() => response.statusText);
                throw new Error(
                    `Stream failed: ${response.status} ${response.statusText} - ${errorText}`
                );
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error("No reader available - response body is null");
            }

            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    // Process remaining buffer
                    if (buffer.trim()) {
                        this.processSSEBuffer(buffer, onEvent);
                    }
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n\n");

                // Keep the last incomplete line in buffer
                buffer = lines.pop() || "";

                // Process complete SSE messages
                for (const line of lines) {
                    if (line.trim()) {
                        this.processSSELine(line, onEvent);
                    }
                }
            }
        } catch (error) {
            if (this.debug) {
                console.error("[NonefinityClient] Stream error:", error);
            }

            onEvent({
                event: "error",
                data: {
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown stream error",
                },
            });

            throw error;
        }
    }

    /**
     * Process a single SSE line
     */
    private processSSELine(
        line: string,
        onEvent: (event: StreamEvent) => void
    ): void {
        const eventMatch = line.match(/^event: (.+)$/m);
        const dataMatch = line.match(/^data: (.+)$/m);

        if (eventMatch || dataMatch) {
            const eventType = eventMatch ? eventMatch[1] : "message";
            const dataStr = dataMatch ? dataMatch[1] : "{}";

            try {
                if (dataStr && dataStr.trim() === '"[START]"') {
                    onEvent({ event: "start", data: {} });
                    return;
                }
                if (dataStr && dataStr.trim() === '"[END]"') {
                    onEvent({ event: eventType, data: { done: true } });
                    return;
                }

                const data = JSON.parse(dataStr || "{}");
                onEvent({ event: eventType, data });
            } catch (e) {
                if (this.debug) {
                    console.error(
                        "[NonefinityClient] Failed to parse SSE data:",
                        e
                    );
                }
                onEvent({
                    event: eventType,
                    data: { raw: dataStr || "", parseError: String(e) },
                });
            }
        }
    }

    /**
     * Process SSE buffer (for remaining data at end of stream)
     */
    private processSSEBuffer(
        buffer: string,
        onEvent: (event: StreamEvent) => void
    ): void {
        const lines = buffer.split("\n\n").filter((line) => line.trim());
        for (const line of lines) {
            this.processSSELine(line, onEvent);
        }
    }

    /**
     * Save conversation batch
     */
    async saveConversation(
        sessionId: string,
        request: SaveConversationRequest
    ): Promise<ApiResponse<{ saved: number }>> {
        return this.request<{ saved: number }>(
            `/chats/sessions/${sessionId}/save-conversation`,
            {
                method: "POST",
                body: JSON.stringify(request),
            }
        );
    }

    // ==================== API Key Management Methods ====================

    /**
     * Create a new API key
     * Returns the API key only once - save it securely!
     */
    async createAPIKey(
        data: APIKeyCreate
    ): Promise<ApiResponse<APIKeyCreateResponse>> {
        return this.request<APIKeyCreateResponse>("/api-keys", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }

    /**
     * List all API keys
     */
    async listAPIKeys(
        skip: number = 0,
        limit: number = 100,
        includeInactive: boolean = false
    ): Promise<ApiResponse<APIKeyListResponse>> {
        return this.request<APIKeyListResponse>(
            `/api-keys?skip=${skip}&limit=${limit}&include_inactive=${includeInactive}`
        );
    }

    /**
     * Get a specific API key
     */
    async getAPIKey(keyId: string): Promise<ApiResponse<APIKeyResponse>> {
        return this.request<APIKeyResponse>(`/api-keys/${keyId}`);
    }

    /**
     * Update an API key
     */
    async updateAPIKey(
        keyId: string,
        data: APIKeyUpdate
    ): Promise<ApiResponse<APIKeyResponse>> {
        return this.request<APIKeyResponse>(`/api-keys/${keyId}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    }

    /**
     * Revoke an API key (set to inactive)
     */
    async revokeAPIKey(keyId: string): Promise<ApiResponse<APIKeyResponse>> {
        return this.request<APIKeyResponse>(`/api-keys/${keyId}/revoke`, {
            method: "POST",
        });
    }

    /**
     * Delete an API key permanently
     */
    async deleteAPIKey(keyId: string): Promise<ApiResponse<void>> {
        return this.request<void>(`/api-keys/${keyId}`, {
            method: "DELETE",
        });
    }

    /**
     * Auto-resolve the first available chat configuration
     * Useful when no specific chat config ID is provided
     */
    async getFirstChatConfig(): Promise<string> {
        const configs = await this.listConfigs(0, 1);

        if (!configs.success || !configs.data?.chat_configs?.length) {
            throw new Error(
                "No chat configurations found. Please create one in your Nonefinity dashboard."
            );
        }

        return configs.data.chat_configs[0].id;
    }
}
