# Frontend Integration - SDK Setup Guide

## Summary

This guide shows how to integrate the API key management system into your Nonefinity frontend dashboard.

## What Was Created

### 1. **Backend API Key System** ✅
- API key model with secure hashing
- CRUD endpoints for key management  
- Authentication middleware supporting both JWT and API keys
- Permission-based access control

### 2. **Frontend Components** ✅
- API key management page (`src/screen/dashboard/api-keys/`)
- Service layer for API calls
- TypeScript types
- SDK configuration guide component

### 3. **Integration Steps**

#### Step 1: Backend Setup

1. **Register API Key Router**

Edit your main FastAPI application file:

```python
# app/main.py
from app.api import api_keys

# Add after other router includes
app.include_router(api_keys.router, prefix="/api")
```

2. **Initialize Database Model**

The APIKey model will be automatically initialized when you run the backend (using Beanie).

#### Step 2: Frontend Setup

1. **Add Route to Dashboard**

Edit `src/screen/dashboard/index.tsx`:

```tsx
import APIKeysManagement from "./api-keys";

// Inside your routing or tabs configuration:
{
  key: "api-keys",
  label: "API Keys",
  icon: <KeyOutlined />,
  children: <APIKeysManagement />,
}
```

2. **Verify Endpoints**

Ensure the endpoints are correctly configured in `src/consts/endpoint.ts` (already done):

```typescript
API_KEYS: {
  LIST: "/api-keys",
  CREATE: "/api-keys",
  GET: (id: string) => `/api-keys/${id}`,
  UPDATE: (id: string) => `/api-keys/${id}`,
  DELETE: (id: string) => `/api-keys/${id}`,
  REVOKE: (id: string) => `/api-keys/${id}/revoke`,
}
```

## Usage Flow

### Creating an API Key

1. User logs into dashboard
2. Navigates to "API Keys" page
3. Clicks "Create API Key"
4. Fills in form:
   - Name: "Production Website"
   - Expires in: 365 days (optional)
   - Permissions: ["chat:read", "chat:write"]
5. Submits form
6. **API key is shown ONCE** - user must copy it
7. Modal shows SDK configuration example

### Using the API Key

Once created, users can use the API key in their external applications:

```typescript
import { NonefinityClient } from "@nonefinity/ai-sdk";

const client = new NonefinityClient({
  apiUrl: "https://your-api-url.com",
  apiKey: "nf_live_...", // The created API key
});

// Now works without JWT authentication!
const sessions = await client.listSessions();
```

## Features

### API Keys Management Page

- ✅ **Create API Keys** - Generate new keys with custom names and expiration
- ✅ **List API Keys** - View all keys with status, permissions, usage stats
- ✅ **Statistics Dashboard** - Total, active, and inactive keys count
- ✅ **Revoke Keys** - Instantly deactivate compromised keys
- ✅ **Delete Keys** - Permanently remove keys
- ✅ **Copy API Key** - One-time display with copy button
- ✅ **SDK Config Guide** - Automatic code examples with user's API key

### Security Features

- 🔒 Keys are hashed (SHA-256) before storage
- 🔒 Original key shown only once during creation
- 🔒 Expiration support (1-365 days or never)
- 🔒 Permission-based access control
- 🔒 Activity tracking (last_used_at)
- 🔒 Instant revocation capability

### SDK Configuration Guide Component

Automatically shows users:
- Installation instructions
- Code examples (TypeScript, React, Vanilla JS)
- Environment variable setup
- Security best practices
- Links to documentation

## Files Created

### Backend
```
app/
├── models/api_key.py          # API key model
├── schemas/api_key.py         # Pydantic schemas
├── crud/api_key.py            # CRUD operations
├── utils/api_key_auth.py      # Authentication middleware
└── api/api_keys.py            # API endpoints
```

### Frontend
```
src/screen/dashboard/api-keys/
├── index.tsx                   # Main management page
├── types.ts                    # TypeScript types
├── services.ts                 # API service layer
└── sdk-config-guide.tsx        # Configuration guide component
```

## Environment Setup

### Backend (.env)
```bash
# Existing configuration...
# No additional env variables needed for API keys
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:8000
# Users will set their own API keys
```

## Testing

### 1. Test API Key Creation

```bash
# Start backend
cd Nonefinity_BE
python -m uvicorn app.main:app --reload

# Start frontend
cd Nonefinity_FE
npm run dev
```

1. Login to dashboard
2. Navigate to API Keys
3. Create a new key
4. Copy the API key when shown

### 2. Test SDK with API Key

```bash
cd Nonefinity_SDK
npm run build
```

Use the test page:
```html
<!-- test/embed-test.html -->
<!-- Set your API key and test! -->
```

### 3. Test API Key Authentication

```bash
# Test with curl
curl -H "Authorization: Bearer nf_live_your_key" \
  http://localhost:8000/api/chats/configs
```

## Troubleshooting

### "Module not found" errors
- Ensure all dependencies are installed: `npm install`
- Check import paths match your project structure

### API key not working
- Verify the key is active (not revoked)
- Check the key hasn't expired
- Ensure backend includes the API key router

### CORS errors
- Configure CORS in backend to allow your frontend origin
- Check API_CONFIG.BASE_URL in frontend matches backend

## Next Steps

1. **Add to Navigation** - Add API Keys to your dashboard sidebar
2. **Customize UI** - Adjust colors/branding to match your design
3. **Add Analytics** - Track API key usage metrics
4. **Rate Limiting** - Add rate limits per API key (optional)
5. **Webhooks** - Notify users when keys are about to expire

## Support

For issues:
- Check backend logs for API errors
- Check browser console for frontend errors
- Verify API key is active and not expired
- Review the [API_KEY_SETUP.md](../../Nonefinity_SDK/API_KEY_SETUP.md) guide

## Summary

You now have a complete API key management system integrated into your dashboard! Users can:

1. ✅ Create API keys from the dashboard
2. ✅ See their API key only once (secure)
3. ✅ Get automatic SDK configuration code
4. ✅ Manage (revoke/delete) their keys
5. ✅ Use API keys for external integrations without JWT auth

The SDK is ready to be used on any website with just an API key! 🚀
