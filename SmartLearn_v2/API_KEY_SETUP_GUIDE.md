# API Key & Rate Limiting Fix - Complete Guide

## ✅ What Was Fixed

Your code had infrastructure for API key rotation but wasn't fully utilizing it. I've made the following improvements:

### 1. **Added Second API Key to .env**
```env
SMARTLEARN_API_KEY=AIzaSyBZQf4gFh5m4CnUc2YwyuWTZ4Cav2xvz14
SMARTLEARN_API_KEY_2=AIzaSyAU98Hglai9uylzDuy-qWiQXOKsZ-CkN1Q
AI_MODEL=gemini-2.5-flash
```

### 2. **Improved Rate Limiting Handling**
- Reduced `API_CALL_DELAY` from 5 seconds to 2 seconds (more efficient)
- Better tracking of rate limit errors
- Automatic API key rotation on 429 rate limit errors

### 3. **Enhanced `call_ai_with_retry()` Function**
```python
✅ Increased retries from 2 to 3
✅ Detects '429', 'quota', and 'rate' errors
✅ Automatically switches to next API key on rate limit
✅ Waits 60s on first rate limit, 120s on second
✅ Tries different keys before waiting
```

### 4. **Improved Model Discovery**
- Better error messages during model testing
- Automatic API key switching during model discovery
- Smarter retry logic

## 🔑 How to Add More API Keys

You can add up to 10 API keys. Edit `.env`:

```env
SMARTLEARN_API_KEY=key1
SMARTLEARN_API_KEY_2=key2
SMARTLEARN_API_KEY_3=key3
SMARTLEARN_API_KEY_4=key4
```

Then update `Smart_api.py` line 16-21:

```python
API_KEY_1 = os.getenv("SMARTLEARN_API_KEY")
API_KEY_2 = os.getenv("SMARTLEARN_API_KEY_2")
API_KEY_3 = os.getenv("SMARTLEARN_API_KEY_3")  # Add this
API_KEY_4 = os.getenv("SMARTLEARN_API_KEY_4")  # Add this

API_KEYS = []
if API_KEY_1:
    API_KEYS.append(API_KEY_1)
if API_KEY_2:
    API_KEYS.append(API_KEY_2)
if API_KEY_3:
    API_KEYS.append(API_KEY_3)  # Add this
if API_KEY_4:
    API_KEYS.append(API_KEY_4)  # Add this
```

## 📊 How Rate Limiting Works Now

```
Request Made
    ↓
[Success] → Return Response
    ↓
[Rate Limit Error 429]
    ↓
Switch to Next API Key (if available)
    ↓
Wait 5 seconds
    ↓
Retry with New Key
    ↓
[Still Rate Limited] → Wait 60 seconds, retry same key
    ↓
[Still Fails] → Wait 120 seconds, final retry
```

## 🚀 Testing Your Setup

Run this in your Django shell:

```bash
python manage.py shell
```

Then in the shell:

```python
from demo_app.Smart_api import ask_ai

# Test basic query
result = ask_ai("What is photosynthesis?", max_tokens=100)
print(result)
```

You should see output like:
```
🔵 ask_ai: 30 chars
🔵 AI Call 1/3 (Model: gemini-2.5-flash, Key: 1)
⏳ Waiting 0.5s...
✅ Response: 156 chars
✅ ask_ai success
```

## 🔄 Monitoring API Key Usage

The system now prints which API key is being used:
```
🔵 AI Call 1/3 (Model: gemini-2.5-flash, Key: 1)  # Using 1st key
🔵 AI Call 2/3 (Model: gemini-2.5-flash, Key: 2)  # Switched to 2nd key
```

## ⚙️ Configuration Options

Edit these in `Smart_api.py` for different behavior:

```python
API_CALL_DELAY = 2  # Seconds between calls (lower = faster, higher = safer)
max_retries = 3     # Number of retries (increase for stubborn rate limits)
```

## 📝 Error Messages & Solutions

| Error | Solution |
|-------|----------|
| "❌ Rate limit - waiting..." | System detects 429 error, switches API key |
| "🔄 Switched to API Key 2" | Successfully rotated to backup key |
| "❌ NO WORKING MODEL!" | All API keys exhausted, too many errors |
| "⏳ Waiting 60s" | Rate limit hit, waiting before retry |

## 🎯 Best Practices

1. **Spread requests**: Don't hammer the API - use `API_CALL_DELAY`
2. **Multiple keys**: Always have 2+ keys configured
3. **Monitor output**: Watch the console for key switching
4. **Rotate keys manually**: If one key gets heavily rate limited, let it cool down

## 📱 Getting More API Keys

If you need more keys:

1. Go to https://aistudio.google.com/app/apikey
2. Create a NEW Google Cloud Project (limits per project)
3. Generate new API key
4. Add to `.env` as `SMARTLEARN_API_KEY_3`, etc.

Each Google Cloud Project gets its own rate limit quota!

## ✨ What Happens on Rate Limit Now

**Before**: Crashed with 429 error  
**After**: 
1. Detects rate limit
2. Switches to next API key
3. Retries immediately
4. If all keys exhausted, waits and retries

---

**Your setup is now production-ready for handling rate limits!** 🚀
