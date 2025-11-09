# @nonefinity/ai-sdk

[![npm version](https://badge.fury.io/js/%40nonefinity%2Fai-sdk.svg)](https://www.npmjs.com/package/@nonefinity/ai-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

AI SDK for integrating Nonefinity's powerful chat system into any website. Built with TypeScript, React, and Server-Sent Events (SSE) for real-time streaming.

## Features

- 🚀 **Easy Integration** - Drop-in chat widget for any website
- 💬 **Real-time Streaming** - Server-Sent Events (SSE) for live responses
- 🛠️ **Tool Execution** - Support for AI agent tools with live feedback
- 🎨 **Customizable UI** - Flexible styling and positioning options
- 📦 **TypeScript Support** - Full type definitions included
- ⚛️ **React Components** - Pre-built React components
- 🔐 **Secure** - Support for API keys and custom auth tokens

## Installation

```bash
npm install @nonefinity/ai-sdk
# or
yarn add @nonefinity/ai-sdk
# or
pnpm add @nonefinity/ai-sdk
```

## Examples

Check out our example implementation:
- [Nonefinity SDK Example](https://github.com/minhbn3107/Nonefinity_SDK_Example) - Complete React integration with streaming chat

## Quick Start

### React Chat Widget

```tsx
import { ChatWidget } from "@nonefinity/ai-sdk";
import "@nonefinity/ai-sdk/styles";

function App() {
  return (
    <ChatWidget
      sessionId="your-session-id"
      apiUrl="https://your-api-url.com"
      apiKey="your-api-key"
      position="bottom-right"
      primaryColor="#3b82f6"
      title="AI Assistant"
      placeholder="Ask me anything..."
    />
  );
}
```

### Simple Client API

```typescript
import { NonefinitySimpleClient } from "@nonefinity/ai-sdk/simple";

const client = new NonefinitySimpleClient({
  chatConfigId: "your-config-id",
  apiKey: "your-api-key",
  apiUrl: "https://your-api-url.com",
  session: "auto", // auto-generate session ID
});

// Send a message with streaming
await client.chat("Hello, how can you help me?", (event) => {
  if (event.event === "message" && event.data.content) {
    console.log("AI:", event.data.content);
  }
});
```

### Advanced Client API

```typescript
import { NonefinityClient } from "@nonefinity/ai-sdk";

const client = new NonefinityClient({
  apiUrl: "https://your-api-url.com",
  apiKey: "your-api-key",
  debug: true,
});

// Create a chat configuration
const config = await client.createConfig({
  name: "My Chat Bot",
  chat_model_id: "model-id",
  instruction_prompt: "You are a helpful assistant.",
});

// Create a chat session
const session = await client.createSession({
  chat_config_id: config.data.id,
  name: "User Conversation",
});

// Stream a message
await client.streamMessage(
  session.data.id,
  "Hello, how can you help me?",
  (event) => {
    if (event.event === "ai_result") {
      console.log("AI:", event.data.content);
    } else if (event.event === "tool_calls") {
      console.log("Tool called:", event.data.name);
    }
  }
);
```

## API Reference

### NonefinitySimpleClient

Simplified client for basic chat functionality.

```typescript
new NonefinitySimpleClient(config: SimpleClientConfig)
```

**Config Options:**
- `chatConfigId` (string, required) - Chat configuration ID
- `apiKey` (string, required) - API key for authentication
- `apiUrl` (string, optional) - Base URL of your Nonefinity API
- `session` (string | "auto", optional) - Session ID or "auto" to generate

**Methods:**
```typescript
// Send a chat message with streaming
chat(message: string, onEvent: (event: StreamEvent) => void): Promise<void>

// Get current session ID
getSessionId(): string | null

// Clear current session
clearSession(): void

// Create a new session
createSession(): Promise<string>
```

### NonefinityClient

Full-featured client for complete API access.

**Config Options:**
- `apiUrl` (string, required) - Base URL of your Nonefinity API
- `apiKey` (string, optional) - API key for authentication
- `getAuthToken` (function, optional) - Function to get dynamic auth token
- `debug` (boolean, optional) - Enable debug logging

**Key Methods:**
```typescript
// Chat Configuration
listConfigs(skip?: number, limit?: number): Promise<ApiResponse<ChatConfigListResponse>>
createConfig(data: ChatConfigCreate): Promise<ApiResponse<ChatConfig>>
updateConfig(id: string, data: ChatConfigUpdate): Promise<ApiResponse<ChatConfig>>
deleteConfig(id: string): Promise<ApiResponse<void>>

// Chat Sessions
listSessions(skip?: number, limit?: number): Promise<ApiResponse<ChatSessionListResponse>>
createSession(data: ChatSessionCreate): Promise<ApiResponse<ChatSession>>
deleteSession(id: string): Promise<ApiResponse<void>>
clearSessionMessages(id: string): Promise<ApiResponse<void>>

// Streaming
streamMessage(sessionId: string, message: string, onEvent: (event: StreamEvent) => void): Promise<void>
```

### ChatWidget Component

**Props:**
```typescript
interface WidgetConfig {
  sessionId: string; // Required - Chat session ID
  apiUrl: string; // Required - API base URL
  apiKey?: string; // Optional - API key
  getAuthToken?: () => Promise<string | null> | string | null; // Optional - Auth token function
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"; // Default: "bottom-right"
  primaryColor?: string; // Default: "#3b82f6"
  title?: string; // Default: "AI Assistant"
  placeholder?: string; // Default: "Type your message..."
  className?: string; // Optional - Additional CSS classes
  style?: React.CSSProperties; // Optional - Inline styles
  onError?: (error: Error) => void; // Optional - Error callback
}
```

## Stream Events

The SDK emits the following events during streaming:

| Event          | Description                     | Data                                      |
| -------------- | ------------------------------- | ----------------------------------------- |
| `start`        | Stream started                  | `{}`                                      |
| `tool_calls`   | AI is calling a tool            | `{ name, arguments, id? }`                |
| `tool_result`  | Tool execution completed        | `{ name, result, id? }`                   |
| `ai_result`    | AI response content             | `{ role, content, is_delta? }`            |
| `error`        | Error occurred                  | `{ message, status_code? }`               |
| `message`      | Generic message (includes done) | `{ done?: boolean }`                      |

## TypeScript Support

Full TypeScript definitions included:

```typescript
import type {
  ChatConfig,
  ChatSession,
  ChatMessage,
  StreamEvent,
  NonefinityConfig,
  SimpleClientConfig,
} from "@nonefinity/ai-sdk";
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Opera (latest)

## License

MIT © Nonefinity

## Support

For issues and questions, please visit:
- [GitHub Issues](https://github.com/genius-wizard-dev/Nonefinity_Agents/issues)
- [Documentation](https://github.com/genius-wizard-dev/Nonefinity_Agents)
