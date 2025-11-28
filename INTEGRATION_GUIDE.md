# SDK Integration Guide

Complete guide for embedding the Nonefinity AI SDK into external websites.

## Quick Integration (5 minutes)

### Option 1: Using CDN (Easiest)

```html
<!DOCTYPE html>
<html>
    <head>
        <title>My Website</title>
    </head>
    <body>
        <h1>My Website with AI Chat</h1>

        <script type="module">
            import { NonefinityClient } from "https://unpkg.com/@nonefinity/ai-sdk/dist/index.mjs";

            const client = new NonefinityClient({
                // apiUrl: 'https://api.nonefinity.com/api/v1', // Optional: Defaults to production
                apiKey: "nf_live_your_api_key",
            });

            // Use the client
            const sessions = await client.listSessions();
            console.log(sessions);
        </script>
    </body>
</html>
```

### Option 2: Using npm

```bash
npm install @nonefinity/ai-sdk
```

```typescript
import { NonefinityClient } from "@nonefinity/ai-sdk";

const client = new NonefinityClient({
    // apiUrl: process.env.NONEFINITY_API_URL, // Optional: Defaults to production
    apiKey: process.env.NONEFINITY_API_KEY,
});
```

## Full Integration Examples

### 1. Vanilla JavaScript Website

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <title>AI-Powered Website</title>
        <style>
            #chat-container {
                max-width: 600px;
                margin: 50px auto;
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 8px;
            }
            #messages {
                height: 400px;
                overflow-y: auto;
                border: 1px solid #eee;
                padding: 15px;
                margin-bottom: 15px;
                border-radius: 4px;
            }
            .message {
                margin: 10px 0;
                padding: 10px;
                border-radius: 6px;
            }
            .user {
                background: #e3f2fd;
                text-align: right;
            }
            .ai {
                background: #f5f5f5;
            }
            #input-container {
                display: flex;
                gap: 10px;
            }
            input {
                flex: 1;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            button {
                padding: 10px 20px;
                background: #1976d2;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
        </style>
    </head>
    <body>
        <div id="chat-container">
            <h2>AI Chat Assistant</h2>
            <div id="messages"></div>
            <div id="input-container">
                <input
                    type="text"
                    id="messageInput"
                    placeholder="Type your message..."
                />
                <button onclick="sendMessage()">Send</button>
            </div>
        </div>

        <script type="module">
            import { NonefinityClient } from "https://unpkg.com/@nonefinity/ai-sdk/dist/index.mjs";

            // Initialize
            const client = new NonefinityClient({
                // apiUrl: 'https://api.nonefinity.com/api/v1', // Optional: Defaults to production
                apiKey: "nf_live_your_api_key",
                debug: true,
            });

            let sessionId = null;

            // Initialize session on page load
            async function init() {
                try {
                    const configResp = await client.listConfigs(0, 1);
                    if (
                        configResp.success &&
                        configResp.data.chat_configs.length > 0
                    ) {
                        const configId = configResp.data.chat_configs[0].id;

                        const sessionResp = await client.createSession({
                            chat_config_id: configId,
                            name: "Website Chat",
                        });

                        if (sessionResp.success) {
                            sessionId = sessionResp.data.id;
                            console.log("Chat session ready:", sessionId);
                        }
                    }
                } catch (error) {
                    console.error("Initialization error:", error);
                }
            }

            // Send message
            window.sendMessage = async function () {
                if (!sessionId) {
                    alert("Chat not initialized");
                    return;
                }

                const input = document.getElementById("messageInput");
                const message = input.value.trim();
                if (!message) return;

                // Display user message
                addMessage(message, "user");
                input.value = "";

                // Stream AI response
                let aiResponse = "";
                try {
                    await client.streamMessage(sessionId, message, (event) => {
                        if (event.event === "ai_result") {
                            aiResponse += event.data.content;
                            updateAIMessage(aiResponse);
                        } else if (
                            event.event === "message" &&
                            event.data.done
                        ) {
                            finalizeAIMessage();
                        }
                    });
                } catch (error) {
                    console.error("Stream error:", error);
                }
            };

            function addMessage(text, type) {
                const messagesDiv = document.getElementById("messages");
                const messageDiv = document.createElement("div");
                messageDiv.className = `message ${type}`;
                messageDiv.textContent = text;
                messagesDiv.appendChild(messageDiv);
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            }

            let currentAIMessage = null;
            function updateAIMessage(text) {
                if (!currentAIMessage) {
                    const messagesDiv = document.getElementById("messages");
                    currentAIMessage = document.createElement("div");
                    currentAIMessage.className = "message ai";
                    messagesDiv.appendChild(currentAIMessage);
                }
                currentAIMessage.textContent = text;
            }

            function finalizeAIMessage() {
                currentAIMessage = null;
            }

            // Initialize on load
            init();

            // Enter key support
            document
                .getElementById("messageInput")
                .addEventListener("keypress", (e) => {
                    if (e.key === "Enter") sendMessage();
                });
        </script>
    </body>
</html>
```

### 2. React Application

```tsx
import { useState, useEffect } from "react";
import { NonefinityClient } from "@nonefinity/ai-sdk";

function ChatApp() {
    const [client] = useState(
        () =>
            new NonefinityClient({
                // apiUrl: process.env.REACT_APP_API_URL!, // Optional: Defaults to production
                apiKey: process.env.REACT_APP_API_KEY!,
            })
    );

    const [sessionId, setSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<
        Array<{ text: string; type: "user" | "ai" }>
    >([]);
    const [input, setInput] = useState("");
    const [streaming, setStreaming] = useState(false);

    // Initialize session
    useEffect(() => {
        async function init() {
            const configResp = await client.listConfigs(0, 1);
            if (configResp.success && configResp.data.chat_configs.length > 0) {
                const sessionResp = await client.createSession({
                    chat_config_id: configResp.data.chat_configs[0].id,
                    name: "React Chat",
                });
                if (sessionResp.success) {
                    setSessionId(sessionResp.data.id);
                }
            }
        }
        init();
    }, [client]);

    const sendMessage = async () => {
        if (!sessionId || !input.trim() || streaming) return;

        const userMessage = input.trim();
        setMessages((prev) => [...prev, { text: userMessage, type: "user" }]);
        setInput("");
        setStreaming(true);

        let aiResponse = "";
        setMessages((prev) => [...prev, { text: "", type: "ai" }]);

        try {
            await client.streamMessage(sessionId, userMessage, (event) => {
                if (event.event === "ai_result") {
                    aiResponse += event.data.content;
                    setMessages((prev) => {
                        const updated = [...prev];
                        updated[updated.length - 1] = {
                            text: aiResponse,
                            type: "ai",
                        };
                        return updated;
                    });
                } else if (event.event === "message" && event.data.done) {
                    setStreaming(false);
                }
            });
        } catch (error) {
            console.error("Error:", error);
            setStreaming(false);
        }
    };

    return (
        <div style={{ maxWidth: 600, margin: "50px auto", padding: 20 }}>
            <h2>AI Chat</h2>
            <div
                style={{
                    height: 400,
                    overflow: "auto",
                    border: "1px solid #ddd",
                    padding: 15,
                    marginBottom: 15,
                }}
            >
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        style={{
                            margin: "10px 0",
                            padding: 10,
                            background:
                                msg.type === "user" ? "#e3f2fd" : "#f5f5f5",
                            borderRadius: 6,
                            textAlign: msg.type === "user" ? "right" : "left",
                        }}
                    >
                        {msg.text}
                    </div>
                ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type your message..."
                    style={{
                        flex: 1,
                        padding: 10,
                        borderRadius: 4,
                        border: "1px solid #ddd",
                    }}
                    disabled={streaming}
                />
                <button
                    onClick={sendMessage}
                    disabled={streaming || !sessionId}
                >
                    {streaming ? "Sending..." : "Send"}
                </button>
            </div>
        </div>
    );
}

export default ChatApp;
```

### 3. Next.js Application

```typescript
// app/chat/page.tsx
"use client";

import { NonefinityClient } from "@nonefinity/ai-sdk";
import { useState, useEffect } from "react";

export default function ChatPage() {
    const [client] = useState(
        () =>
            new NonefinityClient({
                // apiUrl: process.env.NEXT_PUBLIC_API_URL!, // Optional: Defaults to production
                apiKey: process.env.NEXT_PUBLIC_API_KEY!,
            })
    );

    // ... (same as React example)
}
```

### 4. WordPress Plugin

```php
<?php
/*
Plugin Name: Nonefinity AI Chat
Description: Adds AI chat to your WordPress site
Version: 1.0
*/

function nonefinity_chat_enqueue() {
    wp_enqueue_script(
        'nonefinity-sdk',
        'https://unpkg.com/@nonefinity/ai-sdk/dist/index.mjs',
        array(),
        '1.0',
        true
    );

    wp_add_inline_script('nonefinity-sdk', "
        import { NonefinityClient } from 'https://unpkg.com/@nonefinity/ai-sdk/dist/index.mjs';

        const client = new NonefinityClient({
            // apiUrl: '" . get_option('nonefinity_api_url') . "', // Optional: Defaults to production
            apiKey: '" . get_option('nonefinity_api_key') . "'
        });

        // Initialize chat
        window.nonefinityChat = client;
    ", 'after');
}
add_action('wp_enqueue_scripts', 'nonefinity_chat_enqueue');
?>
```

## Environment Variables

### Development

```bash
# .env.local
NONEFINITY_API_URL=http://localhost:8000
NONEFINITY_API_KEY=nf_live_dev_key
```

### Production

```bash
# .env.production
NONEFINITY_API_URL=https://api.yourdomain.com
NONEFINITY_API_KEY=nf_live_prod_key
```

## Security Best Practices

### ✅ DO

1. **Use Environment Variables**

    ```typescript
    const client = new NonefinityClient({
        // apiUrl: process.env.NONEFINITY_API_URL, // Optional: Defaults to production
        apiKey: process.env.NONEFINITY_API_KEY,
    });
    ```

2. **Never Commit API Keys**

    ```gitignore
    .env
    .env.local
    .env.production
    ```

3. **Use Read-Only Keys for Public Sites**
    ```typescript
    await client.createAPIKey({
        name: "Public Website",
        permissions: ["chat:read"], // Read-only
    });
    ```

### ❌ DON'T

1. Don't hardcode API keys in source code
2. Don't expose keys in client-side code unless necessary
3. Don't use admin keys on public websites

## Testing Your Integration

1. **Build and Test Locally:**

    ```bash
    npm run build
    # Open test/embed-test.html in browser
    ```

2. **Test API Connection:**

    ```typescript
    const response = await client.listConfigs();
    console.log("Connected:", response.success);
    ```

3. **Test Streaming:**
    ```typescript
    await client.streamMessage(sessionId, "Hello", (event) => {
        console.log(event);
    });
    ```

## Deployment Checklist

-   [ ] SDK built successfully (`npm run build`)
-   [ ] API keys created and secured
-   [ ] Environment variables configured
-   [ ] CORS configured on backend
-   [ ] Test page working locally
-   [ ] Production API tested
-   [ ] Error handling implemented
-   [ ] Loading states added
-   [ ] Mobile responsive

## Troubleshooting

### CORS Errors

```python
# Backend: app/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Module Import Errors

-   Ensure SDK is built: `npm run build`
-   Check import path matches your setup
-   Verify CDN URL is correct

### Authentication Errors

-   Verify API key is active
-   Check API key hasn't expired
-   Ensure correct API URL

## Support

-   [GitHub Issues](https://github.com/genius-wizard-dev/Nonefinity_Agents/issues)
-   [Documentation](./README.md)
-   [API Key Setup](./API_KEY_SETUP.md)
