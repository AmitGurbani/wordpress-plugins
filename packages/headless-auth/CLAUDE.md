# Headless Auth

OTP and password authentication with JWT for headless WordPress. Built with [wpts](../wpts/).

## Commands

- `pnpm build` — Build plugin to dist/
- `pnpm dev` — Watch mode rebuild
- `pnpm wp-env:start` — Start local WordPress (Docker required, http://localhost:8888, admin/password)
- `pnpm wp-env:stop` — Stop local WordPress

## Architecture

Multi-file wpts plugin with 5 source files:

- `src/plugin.ts` — Entry file: @Plugin, @AdminPage, 17 @Settings, @Activate/@Deactivate
- `src/jwt.ts` — JWT generation via `ha_generate_jwt` filter, CORS headers, `determine_current_user` auth filter
- `src/otp-routes.ts` — POST /otp/send, POST /otp/verify, GET /otp/test-otp (admin-only)
- `src/login-routes.ts` — POST /auth/login (username/email + password)
- `src/auth-routes.ts` — POST /auth/register, POST /auth/refresh, GET /auth/me, PUT /auth/me
- `src/admin/index.tsx` — React settings page (not transpiled, bundled by wp-scripts)

## Auth Flows

### OTP Login

1. Client sends phone number → `/otp/send` generates OTP, stores hashed in transient, sends via configurable template-based request to external server
2. Client submits OTP → `/otp/verify` checks hash
   - **Existing user**: returns JWT access + refresh tokens
   - **New user**: returns `registration_token` (valid 10 min)
3. New user submits registration token + name → `/auth/register` creates WordPress user, returns JWT tokens

### Password Login

1. Client sends username/email + password → `/auth/login`
2. WordPress `wp_authenticate()` validates credentials (accepts both username and email since WP 4.5.0)
3. On success: returns JWT access + refresh tokens

### Token Lifecycle

4. Access token expires → client gets `401 token_expired` error → calls `/auth/refresh`
5. `/auth/refresh` rotates both tokens; old refresh token stays valid for 30s grace period (idempotent — returns same response on reuse within window, matching Auth0/Okta pattern)
6. All authenticated endpoints use `Authorization: Bearer <access_token>` header
7. Login/register/OTP verify clear any active grace period transient

## Conventions

- **Transient keys**: `ha_otp_<hash>`, `ha_attempts_<hash>`, `ha_reg_<hash>`, `ha_cooldown_<hash>`, `ha_verify_<hash>` (phone hash is `md5(phone)`), `ha_test_otp_latest` (test mode OTP display), `ha_login_attempts_<hash>` (login hash is `md5(username/email)`), `ha_refresh_grace_<userId>` (30s grace period cache for refresh token rotation)
- **Option keys**: `headless_auth_` prefix (e.g., `headless_auth_jwt_secret_key` — hidden option, not a @Setting)
- **User meta**: `phone_number`, `ha_refresh_token_hash`, `ha_refresh_token_expiry`. When WooCommerce is active: `billing_phone`, `billing_first_name`, `billing_last_name` (all synced on registration; `billing_first_name`/`billing_last_name` also synced on profile updates)
- **JWT**: HS256, base64url-encoded, issued by `siteUrl()`, types: `access` and `refresh`
- **Rate limiting**: Transient-based per phone/login hash. Send rate limit window (default 900s) is separate from OTP expiry (300s). Resend cooldown (60s) prevents rapid re-sends. Verify attempts (max 3) protect against brute-force — lockout deletes the OTP. Password login: max 5 attempts per username/email, shares rate_limit_window setting.
- **Registration**: Toggleable via `enable_registration` setting. Default user role configurable via `default_user_role` (defaults to `customer` when WooCommerce is active, `subscriber` otherwise). Username derived from display name (not random). Existing WooCommerce users are matched by `billing_phone` fallback if `phone_number` meta is missing.
- **Password login**: Toggleable via `enable_password_login` setting. Uses WordPress `wp_authenticate()` which accepts both username and email. Password is NOT sanitized before authentication (sanitize_text_field would strip special characters). Returns generic `invalid_credentials` error for both wrong username and wrong password to prevent user enumeration.
- **Test mode**: `otp_test_mode` setting skips external OTP delivery, stores plain OTP in `ha_test_otp_latest` transient for admin display. Rate limiting still applies.
- **OTP server templates**: Headers and payload are fully generic JSON templates (`otp_server_headers_template`, `otp_server_payload_template`, both default to `{}`). Available placeholders: `{{phone}}` (phone number), `{{otp}}` (OTP code), `{{siteName}}` (WP site title), `{{siteUrl}}` (WP site URL). All values are JSON-escaped before substitution via `escapeForJson` helper (`json_encode` + strip outer quotes) to prevent JSON injection. Admin UI has info icon popovers with placeholder reference and examples.
