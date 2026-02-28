# AI Webhook Setup

## Current Issue
The AI chat feature is experiencing errors because the external webhook service is down:
- **Error**: `AI service error: Webhook error: 500 - {"code":0,"message":"There was a problem executing the workflow"}`
- **Webhook URL**: `https://n8n-production-4025.up.railway.app/webhook-test/fitness`

## Solutions

### Option 1: Fix the External Service
The webhook service at `https://n8n-production-4025.up.railway.app/webhook-test/fitness` needs to be fixed or replaced.

### Option 2: Use Environment Variable (Recommended)
Add this to your `.env.local` file:

```bash
NEXT_PUBLIC_AI_WEBHOOK_URL=https://your-new-webhook-url.com/endpoint
```

### Option 3: Implement Fallback
The chat page now has a fallback mechanism that will show a user-friendly message when the AI service is unavailable.

## Current Status
✅ **Fallback implemented** - Users will see a helpful message when AI service is down
✅ **Environment variable support** - Can easily change webhook URL
✅ **Better error handling** - More specific error messages for different failure types

## Next Steps
1. **Immediate**: The fallback will handle the current error gracefully
2. **Short-term**: Set up a new AI webhook service or fix the existing one
3. **Long-term**: Consider implementing a local AI solution or using a more reliable service

## Testing
Try sending a message in the chat - you should now see a helpful error message instead of a crash.
