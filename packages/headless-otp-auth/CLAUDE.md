# Headless OTP Auth

Mobile OTP authentication with JWT for headless WordPress. Built with [wpts](../wpts/).

## Commands

- `pnpm build` — Build plugin to dist/
- `pnpm dev` — Watch mode rebuild
- `pnpm wp-env:start` — Start local WordPress (Docker required, http://localhost:8888, admin/password)
- `pnpm wp-env:stop` — Stop local WordPress

## Architecture

Multi-file wpts plugin with 4 source files:

- `src/plugin.ts` — Entry file: @Plugin, @AdminPage, 14 @Settings, @Activate/@Deactivate
- `src/jwt.ts` — JWT generation via `hoa_generate_jwt` filter, CORS headers, `determine_current_user` auth filter
- `src/otp-routes.ts` — POST /otp/send, POST /otp/verify, GET /otp/test-otp (admin-only)
- `src/auth-routes.ts` — POST /auth/register, POST /auth/refresh, GET /auth/me
- `src/admin/index.tsx` — React settings page (not transpiled, bundled by wp-scripts)

## Auth Flow

1. Client sends phone number → `/otp/send` generates OTP, stores hashed in transient, sends via external server
2. Client submits OTP → `/otp/verify` checks hash
   - **Existing user**: returns JWT access + refresh tokens
   - **New user**: returns `registration_token` (valid 10 min)
3. New user submits registration token + name → `/auth/register` creates WordPress user, returns JWT tokens
4. Access token expires → `/auth/refresh` rotates both tokens
5. All authenticated endpoints use `Authorization: Bearer <access_token>` header

## Conventions

- **Transient keys**: `hoa_otp_<hash>`, `hoa_attempts_<hash>`, `hoa_reg_<hash>`, `hoa_cooldown_<hash>`, `hoa_verify_<hash>` (phone hash is `md5(phone)`), `hoa_test_otp_latest` (test mode OTP display)
- **Option keys**: `headless_otp_auth_` prefix (e.g., `headless_otp_auth_jwt_secret_key` — hidden option, not a @Setting)
- **User meta**: `phone_number`, `hoa_refresh_token_hash`, `hoa_refresh_token_expiry`
- **JWT**: HS256, base64url-encoded, issued by `siteUrl()`, types: `access` and `refresh`
- **Rate limiting**: Transient-based per phone hash. Send rate limit window (default 900s) is separate from OTP expiry (300s). Resend cooldown (60s) prevents rapid re-sends. Verify attempts (max 3) protect against brute-force — lockout deletes the OTP.
- **Registration**: Toggleable via `enable_registration` setting. Default user role configurable via `default_user_role`.
- **Test mode**: `otp_test_mode` setting skips external OTP delivery, stores plain OTP in `hoa_test_otp_latest` transient for admin display. Rate limiting still applies.
