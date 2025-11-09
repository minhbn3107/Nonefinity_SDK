# SDK Embedding Tests

Test pages for the Nonefinity AI SDK embedding functionality.

## Test Files

### 1. `embed-test.html`
**Full API Testing Interface**

- Complete SDK functionality testing
- API key authentication
- Session management
- Message streaming
- Console logging
- Real-time status monitoring

**Usage:**
```bash
# Build the SDK first
cd ..
npm run build

# Open in browser
open test/embed-test.html
# or
python -m http.server 8080
# then visit http://localhost:8080/test/embed-test.html
```

### 2. `widget-test.html`
**Chat Widget Component Testing**

- Test the React ChatWidget component
- Widget configuration
- Embedding demonstration

**Usage:**
```bash
open test/widget-test.html
```

## Prerequisites

1. **Build the SDK:**
   ```bash
   npm install
   npm run build
   ```

2. **Backend Running:**
   - Make sure your Nonefinity backend is running
   - Default: `http://localhost:8000`

3. **API Key:**
   - Create an API key using your dashboard
   - Or use test key for local testing

## Testing Workflow

### Test 1: Basic Connection

1. Open `embed-test.html`
2. Configure API URL and API Key
3. Click "Test Connection"
4. Should see "✅ Connection successful!"

### Test 2: List Configurations

1. Click "List Configs"
2. View available chat configurations
3. Config ID will be auto-filled

### Test 3: Create Session

1. Ensure Config ID is filled
2. Click "Create Session"
3. Session ID will be auto-filled
4. "Send Message" button will be enabled

### Test 4: Stream Messages

1. Enter a message in the text area
2. Click "Send Message"
3. Watch real-time streaming in console
4. See AI responses appear

### Test 5: Widget Embedding

1. Open `widget-test.html`
2. Configure settings
3. Click "Load Widget"
4. Test chat widget functionality

## Configuration

### API URL
```
Local: http://localhost:8000
Production: https://your-production-url.com
```

### API Key Format
```
nf_live_<random_string>
```

### Session ID
- Can be created automatically
- Or provide existing session ID

## Features Tested

- ✅ SDK Initialization
- ✅ API Key Authentication
- ✅ Connection Testing
- ✅ List Configurations
- ✅ List Sessions
- ✅ Create Session
- ✅ Get Session Details
- ✅ Stream Messages
- ✅ Real-time Event Handling
- ✅ Error Handling
- ✅ Console Logging

## Troubleshooting

### CORS Errors
If you see CORS errors, make sure your backend allows the test origin:
```python
# backend: app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Module Not Found
Make sure you've built the SDK:
```bash
npm run build
```

### API Key Invalid
Create a new API key or check that it's active and not expired.

## Next Steps

After successful testing:
1. Deploy your SDK to npm
2. Update production API URLs
3. Integrate into your actual websites
4. Monitor usage and errors

## Support

For issues:
- Check console logs in embed-test.html
- Verify backend is running
- Test API key with curl
- Review [API_KEY_SETUP.md](../API_KEY_SETUP.md)
