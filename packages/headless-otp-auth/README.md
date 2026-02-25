# Headless OTP Auth

Mobile OTP-based authentication with JWT for headless WordPress stores. Generates OTPs locally, delivers via external server, and issues JWT access/refresh tokens.

Built with [wpts](../wpts/) (TypeScript-to-WordPress-Plugin transpiler).

## Documentation

- [Integration Guide](./docs/integration-guide.md) — For mobile/frontend developers: API reference, auth flows, error codes, token management, code examples
- [Admin Guide](./docs/admin-guide.md) — For WordPress site admins: installation, settings, security recommendations, troubleshooting

## Development

```bash
pnpm build         # Build plugin to dist/
pnpm dev           # Watch mode — rebuild on file changes
```

### Local Testing with wp-env

Requires [Docker](https://www.docker.com/products/docker-desktop/).

```bash
pnpm build                # Build first
pnpm wp-env:start         # Start WordPress at http://localhost:8888
pnpm wp-env:stop          # Stop the environment
pnpm wp-env:clean         # Reset everything (database, uploads, etc.)
```

Default credentials: `admin` / `password`

The plugin is auto-mounted from `dist/headless-otp-auth/`. Rebuild with `pnpm build` after code changes (or use `pnpm dev` in a separate terminal).

## Project Structure

```
src/
├── plugin.ts          # Entry — @Plugin, @AdminPage, settings, lifecycle
├── jwt.ts             # JWT generation helper, CORS, auth filter
├── otp-routes.ts      # /otp/send, /otp/verify, /otp/test-otp
├── auth-routes.ts     # /auth/register, /auth/refresh, /auth/me
└── admin/index.tsx    # React settings UI
```

Uses [wpts multi-file support](../wpts/README.md#multi-file-plugins) — `plugin.ts` is the entry file with `@Plugin`, other files contain decorated classes that are merged into the same plugin output.

## REST API Endpoints

All endpoints are under `/headless-otp-auth/v1/`.

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/otp/send` | POST | Public | Send OTP to phone number |
| `/otp/verify` | POST | Public | Verify OTP, returns JWT or registration token |
| `/auth/register` | POST | Public | Register new user with registration token |
| `/auth/refresh` | POST | Public | Refresh expired access token |
| `/auth/me` | GET | Bearer token | Get current user profile |
| `/otp/test-otp` | GET | Admin | Get latest test OTP (test mode only) |

See the [Integration Guide](./docs/integration-guide.md) for detailed request/response examples, error codes, and code samples.

## Settings

Configured via WordPress admin page (OTP Auth menu):

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Test Mode | boolean | false | Skip OTP delivery, display OTP in admin for testing |
| OTP Server URL | string | | External OTP delivery server URL |
| OTP Server API Key | string | | API key for OTP delivery server |
| OTP Length | number | 6 | Digits in generated OTP |
| OTP Expiry | number | 300 | OTP validity in seconds |
| Max OTP Attempts | number | 3 | Rate limit per phone number |
| Max OTP Verify Attempts | number | 3 | Wrong guesses before lockout (OWASP recommends 3) |
| OTP Resend Cooldown | number | 60 | Minimum seconds between resend requests |
| Rate Limit Window | number | 900 | How long send rate limits persist (15 min) |
| Access Token Expiry | number | 3600 | Access token lifetime in seconds |
| Refresh Token Expiry | number | 604800 | Refresh token lifetime in seconds |
| Allowed Origins | string | | Comma-separated CORS origins |
| Enable Registration | boolean | true | Allow new users to register via OTP |
| Default User Role | string | subscriber (customer if WooCommerce active) | WordPress role for new users |

## Architecture

- **JWT**: HS256 tokens generated via WordPress filter (`hoa_generate_jwt`) for reusability. Secret key is auto-generated on activation and stored as a hidden option (not exposed in the admin UI)
- **CORS**: Configurable allowed origins via `rest_pre_serve_request` filter
- **Auth**: `determine_current_user` filter validates Bearer tokens on every REST request
- **Rate limiting**: Transient-based per phone number hash with separate send cooldown, verify attempt limit, and configurable rate limit window
- **Brute-force protection**: OTP verify attempts limited (default 3, per OWASP). Lockout deletes the OTP and forces re-request
- **Registration control**: Toggle to enable/disable new user registration, configurable default role. Username derived from display name
- **WooCommerce compatibility**: Auto-detects WooCommerce. Falls back to `billing_phone` meta for existing WooCommerce users, syncs `billing_phone`/`billing_first_name`/`billing_last_name` on registration, defaults role to `customer`
- **Refresh tokens**: Stored as hashed user meta, supports rotation

## License

GPL-2.0+
