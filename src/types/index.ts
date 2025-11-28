/**
 * Nonefinity AI SDK Types
 * Type definitions for the AI chat system
 */

// API Response Types
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}

// Chat Configuration Types
export interface ChatConfig {
    id: string;
    name: string;
    chat_model_id: string;
    embedding_model_id?: string | null;
    knowledge_store_id?: string | null;
    dataset_ids?: string[] | null;
    instruction_prompt?: string | null;
    created_at: string;
    updated_at: string;
    id_alias: string;
}

export interface ChatConfigCreate {
    name: string;
    chat_model_id: string;
    embedding_model_id?: string | null;
    knowledge_store_id?: string | null;
    dataset_ids?: string[] | null;
    instruction_prompt?: string | null;
}

export interface ChatConfigUpdate extends Partial<ChatConfigCreate> {}

export interface ChatConfigListResponse {
    chat_configs: ChatConfig[];
    total: number;
    skip: number;
    limit: number;
}

// Chat Session Types
export interface ChatSession {
    id: string;
    chat_config_id: string;
    name: string;
    created_at: string;
    updated_at: string;
    messages?: ChatMessageListResponse;
}

export interface ChatSessionCreate {
    chat_config_id: string;
    name: string;
}

export interface ChatSessionListResponse {
    chat_sessions: ChatSession[];
    total: number;
    skip: number;
    limit: number;
}

// Chat Message Types
export interface ToolCall {
    name: string;
    arguments?: Record<string, any>;
    result?: any;
}

export interface ChatMessage {
    id: string;
    session_id: string;
    role: "user" | "assistant" | "system" | "tool";
    content: string;
    tools?: ToolCall[];
    created_at: string;
    updated_at: string;
}

export interface ChatMessageListResponse {
    chat_messages: ChatMessage[];
    total: number;
    skip: number;
    limit: number;
}

export interface SaveConversationRequest {
    messages: Array<{
        role: string;
        content: string;
        tools?: ToolCall[];
    }>;
}

// Stream Event Types
export interface StreamEvent {
    event: string;
    data: any;
}

export interface StreamToolCallEvent {
    event: "tool_calls";
    data: {
        id?: string;
        name: string;
        arguments: Record<string, any>;
    };
}

export interface StreamToolResultEvent {
    event: "tool_result" | "tool_results";
    data: {
        id?: string;
        name: string;
        result: any;
    };
}

export interface StreamAIResultEvent {
    event: "ai_result";
    data: {
        role: string;
        content: string;
        is_delta?: boolean;
    };
}

export interface StreamErrorEvent {
    event: "error";
    data: {
        message: string;
        status_code?: number;
    };
}

export type StreamEventType =
    | StreamToolCallEvent
    | StreamToolResultEvent
    | StreamAIResultEvent
    | StreamErrorEvent
    | StreamEvent;

// API Key Types
export interface APIKeyCreate {
    name: string;
    expires_in_days?: number;
}

export interface APIKeyResponse {
    id: string;
    name: string;
    key_prefix: string;
    is_active: boolean;
    last_used_at?: string | null;
    expires_at?: string | null;
    created_at: string;
    updated_at: string;
}

export interface APIKeyCreateResponse extends APIKeyResponse {
    api_key: string; // Only returned once during creation
}

export interface APIKeyListResponse {
    api_keys: APIKeyResponse[];
    total: number;
    skip: number;
    limit: number;
}

export interface APIKeyUpdate {
    name?: string;
    is_active?: boolean;
}

// SDK Configuration Types
export interface NonefinityConfig {
    apiUrl?: string;
    apiKey?: string;
    getAuthToken?: () => Promise<string | null> | string | null;
    debug?: boolean;
}

// Helper function to resolve default API URL
export function getDefaultApiUrl(): string {
    // Always use the production URL by default
    return "https://api.nonefinity.com/api/v1";
}

// Widget Configuration Types
export interface WidgetTheme {
    mode?: "light" | "dark" | "system";
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    fontSize?: string;
    fontFamily?: string;
    borderRadius?: string;
    width?: string;
    height?: string;
}

export interface WidgetConfig extends NonefinityConfig {
    sessionId: string;
    position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
    primaryColor?: string; // Deprecated in favor of theme.primaryColor
    title?: string;
    placeholder?: string;
    className?: string;
    style?: React.CSSProperties;
    theme?: WidgetTheme;
    onError?: (error: Error) => void;
}

// Chat Interface State Types
export interface ChatInterfaceState {
    messages: ChatMessage[];
    isStreaming: boolean;
    isThinking: boolean;
    errorMessage: string | null;
}
