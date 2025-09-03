# Zapier Platform CLI

This is the `zapier` CLI, which you can use to build integrations with Zapier.

For documentation:

- [Platform Docs](https://docs.zapier.com/platform)
- [CLI Reference](https://github.com/zapier/zapier-platform/blob/main/packages/cli/docs/cli.md)
- [Schema Reference](https://github.com/zapier/zapier-platform/blob/main/packages/schema/docs/build/schema.md)

## Error Response Handling

Starting with platform-core v10+, `z.request()` automatically handles error responses through a middleware stack that processes responses in the following order:

1. `throwForStaleAuth` - Handles 401 responses (for OAuth2 and Session auth with auto-refresh)
2. `throwForThrottling` - Handles 429 responses (Too Many Requests)
3. Dev's `afterResponse` middleware
4. `throwForStatus` - Handles remaining error status codes (400-599)

### ThrottledError Handling

By default, 429 responses will throw a `ThrottledError` before your `afterResponse` middleware runs. This prevents accidental suppression of throttling responses which could interfere with proper rate limiting.

If you need the old behavior where your `afterResponse` middleware can see 429 responses, use the `throwForThrottlingEarly` flag:

```javascript
const response = await z.request({
  url: 'https://example.com/api',
  throwForThrottlingEarly: true,  // Allows afterResponse to see 429
});
```

**Breaking Change:** This is a breaking change in platform-core v12+. Previously, your `afterResponse` middleware would see 429 responses. Now it will not, unless you explicitly set `throwForThrottlingEarly: true`.

### Middleware Stack Diagram

```
Request
    ↓
[Before Middlewares]
    ↓
HTTP Request
    ↓
[After Middlewares Stack:]
    ↓
throwForStaleAuth (401) ← Only if auth supports auto-refresh
    ↓
throwForThrottling (429) ← NEW: Unless throwForThrottlingEarly=true
    ↓
Your afterResponse middleware
    ↓
throwForStatus (400-599) ← Handles remaining error status codes
    ↓
Response
```

## Development

See [CONTRIBUTING.md](https://github.com/zapier/zapier-platform/blob/main/CONTRIBUTING.md) and [ARCHITECTURE.md](https://github.com/zapier/zapier-platform/blob/main/packages/cli/ARCHITECTURE.md) of this package in particular.
