/**
 * Nonefinity AI SDK - Simple Client Entry
 * Non-React entry point for Node.js and simple browser usage
 */

// Simple Client (no React dependencies)
export { NonefinitySimpleClient } from "./client/NonefinitySimpleClient";
export type { 
  NonefinitySimpleConfig,
  ChatMessage,
  StreamEvent,
  ChatResponse
} from "./client/NonefinitySimpleClient";

// Also export the full client for advanced users
export { NonefinityClient } from "./client/NonefinityClient";

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
  ChatMessage as APIChatMessage,
  ChatMessageListResponse,
  ToolCall,
  SaveConversationRequest,
  StreamEvent as APIStreamEvent,
  StreamToolCallEvent,
  StreamToolResultEvent,
  StreamAIResultEvent,
  StreamErrorEvent,
  StreamEventType,
  NonefinityConfig,
  APIKeyCreate,
  APIKeyResponse,
  APIKeyCreateResponse,
  APIKeyListResponse,
  APIKeyUpdate,
} from "./types";
