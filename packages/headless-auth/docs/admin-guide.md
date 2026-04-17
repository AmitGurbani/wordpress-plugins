# Admin Guide

Setup and configuration guide for WordPress site administrators.

## Installation

1. Download the plugin zip file
2. Go to **Plugins > Add New > Upload Plugin** in WordPress admin
3. Upload the zip and click **Install Now**
4. Click **Activate**

The plugin auto-generates a JWT secret key on activation. No manual configuration is needed to get started beyond setting up your OTP delivery server.

**Recommended:** Go to **Settings > Permalinks** and select "Post name" (or any option other than "Plain"). This enables clean REST API URLs (`/wp-json/...`). The API also works with plain permalinks using the `?rest_route=/...` format, but URLs are longer.

## OTP Delivery Server

The plugin generates OTPs locally but relies on an external server to deliver them (via SMS, WhatsApp, etc.). You need to provide a server that accepts this request:

**Request from the plugin to your server:**

```
POST https://your-otp-server.com/send
Authorization: Bearer <your-api-key>
Content-Type: application/json

{
  "phone": "+919876543210",
  "otp": "123456"
}
```

**Your server must:**
- Accept POST requests with JSON body containing `phone` and `otp`
- Authenticate via the `Authorization: Bearer` header
- Deliver the OTP to the phone number (SMS, WhatsApp, etc.)
- Return a 2xx HTTP status on success

Configure the server URL and API key in the plugin's **OTP** settings tab.

## Settings Reference

Access settings via the **Auth** menu in WordPress admin. Settings are organized into 5 tabs.

### OTP Tab

| Setting | Default | Description |
|---------|---------|-------------|
| Test Mode | Off | Skip OTP delivery and display the generated OTP in the admin settings page. When enabled, a warning banner appears on all admin pages. For development/testing only |
| OTP Server URL | — | URL of your OTP delivery server |
| OTP Server API Key | — | API key sent as Bearer token to the delivery server |
| OTP Length | 6 | Number of digits in the generated OTP (minimum 4) |
| OTP Expiry | 300s (5 min) | How long an OTP remains valid (minimum 60s) |
| Max OTP Attempts | 3 | Maximum OTP send requests per phone before rate limiting (minimum 1) |

### Login Tab

| Setting | Default | Description |
|---------|---------|-------------|
| Enable Password Login | On | Allow users to log in with username/email and password. Disable to restrict to OTP-only |
| Max Login Attempts | 5 | Maximum failed password login attempts per username/email before rate limiting (minimum 1) |

### Security Tab

| Setting | Default | Recommended | Description |
|---------|---------|-------------|-------------|
| Max OTP Verify Attempts | 3 | 3 | Wrong OTP guesses before lockout. OWASP recommends 3 (minimum 1) |
| OTP Resend Cooldown | 60s | 60–120s | Minimum wait between OTP resend requests (minimum 10s) |
| Rate Limit Window | 900s (15 min) | 900s | How long send and verify rate limits persist (minimum 60s) |

### Authentication Tab

| Setting | Default | Recommended | Description |
|---------|---------|-------------|-------------|
| Access Token Expiry | 3600s (1 hr) | 900–3600s | JWT access token lifetime. Shorter = more secure |
| Refresh Token Expiry | 604800s (7 days) | 604800s | JWT refresh token lifetime |
| Enable Registration | On | As needed | Allow new users to register via OTP |
| Default User Role | Subscriber (Customer if WooCommerce active) | Subscriber or Customer | WordPress role assigned to new users |

### Advanced Tab

| Setting | Default | Description |
|---------|---------|-------------|
| Allowed Origins | — | Comma-separated CORS origins for browser-based apps |

**CORS examples:**
- Single origin: `https://myapp.com`
- Multiple origins: `https://myapp.com,https://staging.myapp.com`
- Local development: `http://localhost:3000`

Origins must be exact matches — no wildcards. Native mobile apps don't need CORS configuration.

## WooCommerce Integration

The plugin automatically detects WooCommerce and adapts its behavior:

- **Default role**: New users are assigned the `customer` role instead of `subscriber` (overridable via the Default User Role setting)
- **Phone lookup fallback**: When looking up users by phone, falls back to the `billing_phone` meta field if `phone_number` is not found — this matches existing WooCommerce customers who registered through checkout
- **Billing meta sync**: On registration, `billing_phone`, `billing_first_name`, and `billing_last_name` are populated. On profile updates, `billing_first_name` and `billing_last_name` are kept in sync. This ensures WooCommerce checkout forms are pre-filled
- **Username generation**: Usernames are derived from the display name (e.g., `john_doe`) instead of random strings, with phone suffix appended if the name is taken

No configuration is required — WooCommerce support activates automatically when WooCommerce is installed and active.

## Security Recommendations

### Production Checklist

- Set **OTP Length** to at least 6 digits
- Keep **Max OTP Verify Attempts** at 3 (OWASP recommendation)
- Set **Resend Cooldown** to 60–120 seconds to prevent rapid re-sends
- Use a **Rate Limit Window** of at least 15 minutes
- Set **Access Token Expiry** to 15–60 minutes (shorter is more secure)
- Configure **Allowed Origins** to only your specific domains — never use a wildcard
- Disable **Enable Registration** if you only want existing users to log in
- Use HTTPS for your site — JWT tokens are sent in headers

### What Not to Do

- Don't leave **Test Mode** enabled in production — OTPs won't be delivered to users
- Don't set OTP Expiry longer than 10 minutes
- Don't set Max OTP Verify Attempts higher than 5
- Don't leave Allowed Origins empty if you have browser-based clients (they'll get CORS errors)
- Don't set Access Token Expiry to more than 24 hours

## JWT Secret Key

The plugin auto-generates a secure 64-character random secret key when activated. This key is used to sign JWT tokens (HS256).

- The key is stored in the database and is **not visible** in the admin UI
- It is generated once and persists until the plugin is uninstalled
- You do not need to configure it manually
- If you uninstall and reinstall the plugin, a new key is generated (existing tokens will be invalidated)

## Troubleshooting

### 404 on API endpoints

1. If using pretty permalinks: go to **Settings > Permalinks** and click **Save Changes** (this flushes rewrite rules)
2. If using plain permalinks: the `/wp-json/` path won't work. Use `?rest_route=/headless-auth/v1/...` instead (e.g., `https://your-site.com/?rest_route=/headless-auth/v1/otp/send`)
3. Switching to "Post name" permalinks gives the cleanest REST API URLs

### "OTP delivery is not configured" error

The plugin requires an OTP delivery server URL to send OTPs. Go to the **OTP** tab and fill in the **OTP Server URL** and **OTP Server API Key** fields.

### OTP not sending

1. Check that **OTP Server URL** is correct and accessible from your WordPress server
2. Verify the **OTP Server API Key** matches what your delivery server expects
3. Check your delivery server's logs for incoming requests
4. Ensure your WordPress server can make outbound HTTP requests (some hosts block this)

### CORS errors in browser console

1. Go to the **Advanced** tab in plugin settings
2. Add your app's origin to **Allowed Origins** (e.g., `https://myapp.com`)
3. Include the exact protocol and port (e.g., `http://localhost:3000` for local dev)
4. Origins are case-sensitive and must match exactly

### "Token expired" errors

1. **Access token expired**: Your app should automatically refresh using the refresh token. See the [Integration Guide](./integration-guide.md)
2. **Refresh token expired**: User must re-authenticate with OTP. Consider increasing Refresh Token Expiry if users are frequently logged out
3. **After plugin reinstall**: All existing tokens are invalidated because a new JWT secret is generated

### "JWT is not configured" error

This means the JWT secret key is missing. The key is auto-generated when the plugin is activated. To fix:

1. Deactivate and reactivate the plugin — this generates a new key
2. Note: all existing tokens will be invalidated, so users will need to log in again

### "Registration disabled" message

1. Go to the **Authentication** tab
2. Toggle **Enable New User Registration** on
3. Save settings

### Users getting rate limited

1. Check the **Security** tab for current limits
2. The **Rate Limit Window** controls how long the block lasts (default: 15 minutes)
3. The **OTP Resend Cooldown** controls time between sends (default: 60 seconds)
4. Rate limits are per phone number — other users are not affected
5. Limits reset automatically after the window expires

### Plugin not appearing after install

1. Ensure the plugin files are in `wp-content/plugins/headless-auth/`
2. The main file should be `headless-auth/headless-auth.php`
3. Go to **Plugins** and click **Activate**
4. If you see "Plugin file does not exist", rebuild and restart wp-env (for development setups)
