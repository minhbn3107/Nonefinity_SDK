/**
 * Nonefinity AI SDK
 * Main entry point
 */

// Client
export { NonefinityClient } from "./client/NonefinityClient";
export { NonefinitySimpleClient } from "./client/NonefinitySimpleClient";
export type { 
  NonefinitySimpleConfig,
  ChatMessage as SimpleChatMessage,
  StreamEvent as SimpleStreamEvent,
  ChatResponse as SimpleChatResponse
} from "./client/NonefinitySimpleClient";

// Components
export { ChatWidget } from "./components/ChatWidget";

// Types
export type {
  ApiResponse,
  ChatConfig,
  ChatConfigCreate,
  ChatConfigUpdate,
  ChatConfigListResponse,
  ChatSession,
  ChatSessionCreate,
  ChatSessionListResponse,
  ChatMessage,
  ChatMessageListResponse,
  ToolCall,
  SaveConversationRequest,
  StreamEvent,
  StreamToolCallEvent,
  StreamToolResultEvent,
  StreamAIResultEvent,
  StreamErrorEvent,
  StreamEventType,
  NonefinityConfig,
  WidgetConfig,
  ChatInterfaceState,
  APIKeyCreate,
  APIKeyResponse,
  APIKeyCreateResponse,
  APIKeyListResponse,
  APIKeyUpdate,
} from "./types";
