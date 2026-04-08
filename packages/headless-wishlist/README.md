# Headless Wishlist

REST API wishlist plugin for headless WordPress/WooCommerce stores. Stores wishlisted product IDs per user in WordPress user meta and exposes CRUD endpoints authenticated via JWT.

## Requirements

- WordPress 6.0+
- PHP 8.0+
- WooCommerce (required)
- [Headless Auth](../headless-auth/) for JWT authentication

## Documentation

- **[Integration Guide](docs/integration-guide.md)** — REST API reference, authentication, curl examples, TypeScript client
- **[Admin Guide](docs/admin-guide.md)** — Installation, analytics dashboard, data storage, troubleshooting

## REST API

All `/items` endpoints require JWT authentication (`Authorization: Bearer <token>`).

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/items` | `read` | List user's wishlist (auto-cleans stale products) |
| POST | `/items` | `read` | Add product (201 created, 409 duplicate) |
| DELETE | `/items/{product_id}` | `read` | Remove specific product |
| DELETE | `/items` | `read` | Clear entire wishlist |
| GET | `/analytics/popular` | `manage_options` | Top 20 most wishlisted products (admin) |

## Project Structure

```
src/
├── plugin.ts             # @Plugin, @AdminPage, @Activate
├── wishlist-routes.ts    # GET/POST/DELETE /items endpoints
├── analytics-routes.ts   # GET /analytics/popular (admin-only)
└── admin/                # React analytics dashboard
```

## Development

```bash
pnpm build          # Build plugin to dist/
pnpm dev            # Watch mode
pnpm wp-env:start   # Local WordPress (Docker, http://localhost:8888)
```

Built with [wpts](../wpts/) — TypeScript source in `src/`, generated PHP in `dist/`.
