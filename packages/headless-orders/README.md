# Headless Orders

REST API for authenticated customers to list their WooCommerce orders in headless storefronts. Returns paginated order data with billing, shipping, and line item details.

## Requirements

- WordPress 6.2+
- PHP 8.0+
- WooCommerce (required)
- [Headless Auth](../headless-auth/) for JWT authentication

## Documentation

- **[Integration Guide](docs/integration-guide.md)** — REST API reference, authentication, curl examples, TypeScript client
- **[Admin Guide](docs/admin-guide.md)** — Installation, how it works, verifying setup, troubleshooting

## REST API

The `/orders` endpoint requires JWT authentication (`Authorization: Bearer <token>`).

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/orders` | JWT | List authenticated customer's WooCommerce orders |

## Project Structure

```
src/
├── plugin.ts          # @Plugin (wooNotice: 'required'), no settings
└── order-routes.ts    # GET /orders endpoint with formatOrder helper
```

## Development

```bash
pnpm build          # Build plugin to dist/
pnpm dev            # Watch mode
pnpm wp-env:start   # Local WordPress (Docker, http://localhost:8888)
```

Built with [wpts](../wpts/) — TypeScript source in `src/`, generated PHP in `dist/`.
