# API Key Setup & Authorization Guide

This guide explains how to set up and use API keys with the Nonefinity AI SDK for secure external integrations.

## Overview

API keys allow you to authenticate your applications without requiring user login. They're perfect for:
- Server-to-server integrations
- External website embedding
- Automated workflows
- Third-party applications

## Quick Start

### 1. Create an API Key

First, log into your Nonefinity dashboard and create an API key using JWT authentication:

```typescript
import { NonefinityClient } from "@nonefinity/ai-sdk";

// Initialize client with JWT token (from your login)
const client = new NonefinityClient({
  apiUrl: "https://your-api-url.com",
  getAuthToken: async () => {
    // Get your JWT token from your auth system (e.g., Clerk)
    return yourAuthToken;
  },
});

// Create a new API key
const response = await client.createAPIKey({
  name: "Production Website",
  expires_in_days: 365, // Optional: expires in 1 year
  permissions: ["chat:read", "chat:write"], // Optional: defaults to chat permissions
});

if (response.success && response.data) {
  console.log("API Key created!");
  console.log("Key:", response.data.api_key);
  // ⚠️ IMPORTANT: Save this key securely! It won't be shown again.
}
```

### 2. Use the API Key

Once you have your API key, use it to authenticate:

```typescript
// Initialize client with API key
const client = new NonefinityClient({
  apiUrl: "https://your-api-url.com",
  apiKey: "nf_live_your_api_key_here",
});

// Now you can use all chat features
const sessions = await client.listSessions();
```

### 3. Embed in Your Website

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import { NonefinityClient } from 'https://unpkg.com/@nonefinity/ai-sdk/dist/index.mjs';

    const client = new NonefinityClient({
      apiUrl: 'https://your-api-url.com',
      apiKey: 'nf_live_your_api_key_here'
    });

    // Use the client
    await client.streamMessage(sessionId, "Hello!", (event) => {
      console.log(event);
    });
  </script>
</head>
<body>
  <h1>My Website with AI Chat</h1>
</body>
</html>
```

## API Key Management

### Create an API Key

```typescript
const response = await client.createAPIKey({
  name: "My Integration",
  expires_in_days: 90, // Optional: null for no expiration
  permissions: ["chat:read", "chat:write"], // Optional
});

// Save the API key securely
const apiKey = response.data?.api_key;
```

**Important**: The API key is only shown once during creation. Store it securely!

### List API Keys

```typescript
const response = await client.listAPIKeys();

if (response.success && response.data) {
  response.data.api_keys.forEach(key => {
    console.log(`${key.name}: ${key.key_prefix}... (${key.is_active ? 'Active' : 'Inactive'})`);
    console.log(`  Last used: ${key.last_used_at || 'Never'}`);
    console.log(`  Expires: ${key.expires_at || 'Never'}`);
  });
}
```

### Get API Key Details

```typescript
const response = await client.getAPIKey(keyId);

if (response.success && response.data) {
  console.log("Key name:", response.data.name);
  console.log("Active:", response.data.is_active);
  console.log("Permissions:", response.data.permissions);
}
```

### Update API Key

```typescript
// Rename a key
await client.updateAPIKey(keyId, {
  name: "Updated Name"
});

// Change permissions
await client.updateAPIKey(keyId, {
  permissions: ["chat:read"] // Read-only
});

// Deactivate a key
await client.updateAPIKey(keyId, {
  is_active: false
});
```

### Revoke an API Key

```typescript
// Revoke (deactivate) a key
await client.revokeAPIKey(keyId);
```

### Delete an API Key

```typescript
// Permanently delete a key
await client.deleteAPIKey(keyId);
```

## API Key Format

API keys follow this format: `nf_live_<random_string>`

- **Prefix**: `nf_live_` indicates a production API key
- **Random part**: Cryptographically secure random string

## Permissions

API keys support the following permissions:

| Permission | Description |
|------------|-------------|
| `chat:read` | Read chat configurations, sessions, and messages |
| `chat:write` | Create and update chats, send messages |
| `*` | All permissions (admin) |

**Default permissions**: `["chat:read", "chat:write"]`

## Security Best Practices

### ✅ DO

- **Store API keys securely** - Use environment variables or secure vaults
- **Use HTTPS** - Always communicate over HTTPS
- **Rotate keys regularly** - Create new keys periodically
- **Use specific permissions** - Grant only necessary permissions
- **Monitor key usage** - Check `last_used_at` for suspicious activity
- **Set expiration dates** - Use `expires_in_days` for temporary integrations

### ❌ DON'T

- **Don't commit keys to git** - Add them to `.gitignore`
- **Don't share keys** - Each integration should have its own key
- **Don't use keys in client-side code** - Except for public widgets with limited permissions
- **Don't use expired keys** - Create new ones when they expire

## Environment Variables

### Node.js / Bun

```bash
# .env file
NONEFINITY_API_URL=https://your-api-url.com
NONEFINITY_API_KEY=nf_live_your_api_key_here
```

```typescript
import { NonefinityClient } from "@nonefinity/ai-sdk";

const client = new NonefinityClient({
  apiUrl: process.env.NONEFINITY_API_URL!,
  apiKey: process.env.NONEFINITY_API_KEY!,
});
```

### React

```typescript
// Don't expose API keys in frontend unless necessary
// If you must, use read-only permissions and monitor usage

const client = new NonefinityClient({
  apiUrl: import.meta.env.VITE_NONEFINITY_API_URL,
  apiKey: import.meta.env.VITE_NONEFINITY_API_KEY,
});
```

## Error Handling

```typescript
try {
  const response = await client.createAPIKey({
    name: "My Key"
  });

  if (!response.success) {
    console.error("Failed to create key:", response.error);
  }
} catch (error) {
  console.error("Error:", error);
}
```

## API Key vs JWT Token

| Feature | API Key | JWT Token |
|---------|---------|-----------|
| **Use Case** | Server integrations, external apps | User authentication |
| **Expiration** | Optional (up to 365 days) | Short-lived (hours) |
| **Permissions** | Configurable | Full user access |
| **Best For** | Automated systems | Web/mobile apps |

## Example: Full Integration

```typescript
import { NonefinityClient } from "@nonefinity/ai-sdk";

// Step 1: Create an API key (one-time setup with JWT)
async function setupAPIKey() {
  const setupClient = new NonefinityClient({
    apiUrl: "https://your-api-url.com",
    getAuthToken: async () => yourJWTToken,
  });

  const response = await setupClient.createAPIKey({
    name: "Production Integration",
    expires_in_days: 365,
    permissions: ["chat:read", "chat:write"],
  });

  if (response.success && response.data) {
    console.log("🔑 Save this API key:", response.data.api_key);
    // Store it in your environment variables or secure vault
    return response.data.api_key;
  }
}

// Step 2: Use the API key in your application
async function useChatSystem(apiKey: string) {
  const client = new NonefinityClient({
    apiUrl: "https://your-api-url.com",
    apiKey: apiKey,
  });

  // Create a session
  const sessionResp = await client.createSession({
    chat_config_id: "your-config-id",
    name: "Customer Chat",
  });

  if (sessionResp.success && sessionResp.data) {
    const sessionId = sessionResp.data.id;

    // Stream a message
    await client.streamMessage(
      sessionId,
      "Hello, how can I help?",
      (event) => {
        if (event.event === "ai_result") {
          console.log("AI:", event.data.content);
        }
      }
    );
  }
}

// Run
const apiKey = await setupAPIKey();
await useChatSystem(apiKey);
```

## Monitoring & Maintenance

### Check Key Usage

```typescript
const response = await client.listAPIKeys();

if (response.success && response.data) {
  response.data.api_keys.forEach(key => {
    const daysSinceUse = key.last_used_at 
      ? Math.floor((Date.now() - new Date(key.last_used_at).getTime()) / (1000 * 60 * 60 * 24))
      : Infinity;

    if (daysSinceUse > 90) {
      console.warn(`⚠️ Key "${key.name}" hasn't been used in ${daysSinceUse} days`);
    }
  });
}
```

### Rotate Keys

```typescript
// Create new key
const newKeyResp = await client.createAPIKey({
  name: "Production Key (2024-11)",
  expires_in_days: 365,
});

if (newKeyResp.success && newKeyResp.data) {
  // Update your application to use the new key
  const newApiKey = newKeyResp.data.api_key;
  
  // After verification, revoke the old key
  await client.revokeAPIKey(oldKeyId);
}
```

## Troubleshooting

### "Invalid API key"
- Check that the key starts with `nf_live_`
- Verify the key is active: `is_active: true`
- Ensure the key hasn't expired

### "Permission denied"
- Check the key's permissions match your operation
- Update permissions: `client.updateAPIKey(keyId, { permissions: [...] })`

### "API key is expired"
- Create a new API key
- Update your configuration with the new key

### "API key is inactive"
- Reactivate: `client.updateAPIKey(keyId, { is_active: true })`
- Or create a new key if intentionally revoked

## Support

For issues or questions:
- [GitHub Issues](https://github.com/genius-wizard-dev/Nonefinity_Agents/issues)
- [Documentation](https://github.com/genius-wizard-dev/Nonefinity_Agents)

## Next Steps

- [Main README](./README.md) - SDK overview and features
- [Examples](./examples/) - More code examples
- [Publishing Guide](./PUBLISHING.md) - Publishing to npm
