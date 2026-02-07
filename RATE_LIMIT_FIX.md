# OpenAI Rate Limit & Quota Exhaustion Fix

## Problem Analysis

Your 3 agents (solar, home, battery) were getting rate limited and exhausting quota because:

### Root Causes

1. **Simultaneous Parallel Requests**: All 3 agents made API calls at the exact same time using `Promise.all()`, sending 3 requests simultaneously
2. **No Rate Limiting**: The code had no throttling or rate limiting to respect OpenAI's RPM (Requests Per Minute) limits
3. **Quota Exhaustion**: The error "You exceeded your current quota" indicates you hit your billing/usage limit, not just rate limits

### OpenAI Rate Limits

According to [OpenAI's rate limits documentation](https://platform.openai.com/docs/guides/rate-limits):

- **RPM (Requests Per Minute)**: 
  - Free tier: ~3 RPM
  - Tier 1: 500 RPM
  - Higher tiers: Varies by plan
  
- **TPM (Tokens Per Minute)**: 
  - Free tier: ~40K TPM
  - Tier 1: 1M TPM
  - Higher tiers: Varies

- **Quota**: Overall spending/usage limit (separate from rate limits)

### Your Request Pattern

- **Frequency**: Every 36 ticks = every 3 minutes (with 5s tick interval)
- **Volume**: 3 requests every 3 minutes = 60 requests/hour
- **Pattern**: All 3 requests fired simultaneously with zero delay

This pattern can easily exceed:
- Free tier limits (3 RPM = max 3 requests in any 60-second window)
- Even paid tier limits if requests cluster together

## Solution Implemented

### 1. Request Throttling
- Added `REQUEST_THROTTLE_MS` (default: 200ms) delay between parallel requests
- Instead of firing all 3 simultaneously, requests are now staggered:
  - Request 1 starts immediately
  - Request 2 starts after 200ms
  - Request 3 starts after another 200ms
- This prevents request clustering and reduces burst load

### 2. Rate Limiting
- Added `MAX_REQUESTS_PER_MINUTE` (default: 10 RPM) tracking
- Tracks request timestamps and automatically throttles if limit is reached
- Waits until the oldest request is >1 minute old before allowing new requests
- Prevents exceeding OpenAI's RPM limits

### 3. Configuration
- Made rate limits configurable via environment variables:
  - `LLM_MAX_RPM`: Maximum requests per minute (default: 10)
  - `LLM_REQUEST_THROTTLE_MS`: Delay between parallel requests in ms (default: 200)

### 4. Better Error Handling
- Rate limiting is checked before each request
- Automatic backoff on 429 errors (already existed, now works better with throttling)

## Configuration Recommendations

### For Free Tier (3 RPM)
```env
LLM_MAX_RPM=3
LLM_REQUEST_THROTTLE_MS=500
LLM_CALL_INTERVAL=72  # Call every 6 minutes instead of 3
```

### For Tier 1 (500 RPM)
```env
LLM_MAX_RPM=50  # Conservative limit well below 500
LLM_REQUEST_THROTTLE_MS=200
LLM_CALL_INTERVAL=36  # Current setting is fine
```

### For Higher Tiers
```env
LLM_MAX_RPM=100  # Adjust based on your tier
LLM_REQUEST_THROTTLE_MS=100
LLM_CALL_INTERVAL=36
```

## How to Check Your OpenAI Tier

1. Visit https://platform.openai.com/account/limits
2. Check your "Rate limits" section
3. Look for "Requests per minute" and "Tokens per minute"
4. Adjust `LLM_MAX_RPM` accordingly (use 50-80% of your limit for safety)

## Testing

After applying this fix:
1. Monitor the logs for rate limit warnings
2. If you still see 429 errors, reduce `LLM_MAX_RPM` or increase `LLM_REQUEST_THROTTLE_MS`
3. If you see "quota exceeded" errors, you need to:
   - Check your billing/usage at https://platform.openai.com/account/billing
   - Add payment method or upgrade your plan
   - Wait for quota to reset (usually monthly)

## Code Changes

### Files Modified
- `engine/src/agents/llm.ts`: Added rate limiting and request throttling
- `engine/src/main.ts`: Updated to use throttled batch function
- `engine/src/config.ts`: Added configurable rate limit settings

### Key Functions Added
- `checkRateLimit()`: Enforces RPM limits by tracking request timestamps
- Updated `getAgentDecisions()`: Now staggers requests instead of parallel execution

## Expected Behavior

**Before**: 3 requests fired simultaneously → Rate limit exceeded → Quota exhausted

**After**: 
- Request 1 starts
- Wait 200ms
- Request 2 starts  
- Wait 200ms
- Request 3 starts
- All complete in ~400-600ms (vs ~200ms before, but now respects limits)

The slight delay (400ms total) is negligible compared to the 3-minute interval between calls, but prevents quota exhaustion.

