# Integration Guide

Headless Orders provides REST API endpoints for authenticated customers to retrieve their WooCommerce orders from a headless frontend. Orders are queried from WooCommerce's data store, filtered to the authenticated customer, and returned with pagination support.

## Overview

```
Frontend (Next.js, React Native, etc.)     WordPress + WooCommerce
───────────────────────────────────────    ──────────────────────────────
GET /orders  ────────────────────────────→ List customer's orders (paginated)
GET /orders/:id  ────────────────────────→ Get a single order by ID
GET /orders?status=completed  ───────────→ Filter by order status
GET /orders?per_page=10&page=2  ─────────→ Paginate through results
```

**Base URL:** `https://your-site.com/wp-json/headless-orders/v1`

If the site uses plain permalinks: `https://your-site.com/?rest_route=/headless-orders/v1`

**Key design points:**
- Orders are scoped to the authenticated customer — a user can never see another customer's orders
- JWT authentication via [Headless Auth](../../headless-auth/) companion plugin
- Pagination headers (`X-WP-Total`, `X-WP-TotalPages`) for building paginated UIs
- Optional status filter with server-side allowlist validation

---

## Authentication

The `/orders` endpoint requires a valid JWT token issued by the [Headless Auth](../../headless-auth/) plugin. Pass the token in the `Authorization` header:

```
Authorization: Bearer <JWT>
```

The token is resolved to a WordPress user ID via Headless Auth's `determine_current_user` filter. Only that user's orders are returned.

See the [Headless Auth Integration Guide](../../headless-auth/docs/integration-guide.md) for how to obtain a JWT token.

---

## Quick Start

### 1. List your orders

```bash
curl https://your-site.com/wp-json/headless-orders/v1/orders \
  -H "Authorization: Bearer $JWT"
```

### 2. Filter by status

```bash
curl "https://your-site.com/wp-json/headless-orders/v1/orders?status=completed" \
  -H "Authorization: Bearer $JWT"
```

### 3. Get a single order

```bash
curl https://your-site.com/wp-json/headless-orders/v1/orders/1042 \
  -H "Authorization: Bearer $JWT"
```

### 4. Paginate

```bash
curl "https://your-site.com/wp-json/headless-orders/v1/orders?per_page=10&page=2" \
  -H "Authorization: Bearer $JWT"
```

---

## API Reference

### GET /orders

Returns the authenticated customer's WooCommerce orders, sorted by date (newest first). Includes billing/shipping addresses and line items for each order.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `per_page` | number | `20` | Results per page (1–100) |
| `page` | number | `1` | Page number |
| `status` | string | — | Filter by order status |

**Valid status values:** `pending`, `processing`, `completed`, `cancelled`, `refunded`, `failed`, `on-hold`

#### Request

```bash
curl "https://your-site.com/wp-json/headless-orders/v1/orders?per_page=10&status=completed" \
  -H "Authorization: Bearer $JWT"
```

#### Response Headers

| Header | Description |
|--------|-------------|
| `X-WP-Total` | Total number of orders matching the query |
| `X-WP-TotalPages` | Total number of pages |

#### Success Response (200)

```json
[
  {
    "id": 1042,
    "order_number": "1042",
    "status": "completed",
    "created_at": "2026-04-08T14:30:00+00:00",
    "updated_at": "2026-04-09T09:15:00+00:00",
    "total": "89.97",
    "shipping_total": "5.99",
    "currency": "USD",
    "payment_method": "stripe",
    "customer_note": "",
    "billing": {
      "first_name": "Jane",
      "last_name": "Doe",
      "address_1": "123 Main St",
      "address_2": "",
      "city": "Springfield",
      "state": "IL",
      "postcode": "62701",
      "country": "US",
      "email": "jane@example.com",
      "phone": "555-0123"
    },
    "shipping": {
      "first_name": "Jane",
      "last_name": "Doe",
      "address_1": "123 Main St",
      "address_2": "",
      "city": "Springfield",
      "state": "IL",
      "postcode": "62701",
      "country": "US",
      "phone": "555-0123"
    },
    "items": [
      {
        "product_id": 456,
        "variation_id": 0,
        "name": "Organic Honey",
        "quantity": 2,
        "subtotal": "39.98",
        "total": "39.98"
      },
      {
        "product_id": 789,
        "variation_id": 12,
        "name": "Brown Rice 5kg",
        "quantity": 1,
        "subtotal": "44.00",
        "total": "44.00"
      }
    ]
  }
]
```

#### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 401 | `rest_forbidden` | Authentication required (no valid JWT) |
| 503 | `woocommerce_required` | WooCommerce is not active |
| 400 | `invalid_status` | Invalid order status value |

---

### GET /orders/:id

Returns a single order by ID, if it belongs to the authenticated customer. Returns the same order object shape as the list endpoint.

#### Request

```bash
curl https://your-site.com/wp-json/headless-orders/v1/orders/1042 \
  -H "Authorization: Bearer $JWT"
```

#### Success Response (200)

```json
{
  "id": 1042,
  "order_number": "1042",
  "status": "completed",
  "created_at": "2026-04-08T14:30:00+00:00",
  "updated_at": "2026-04-09T09:15:00+00:00",
  "total": "89.97",
  "shipping_total": "5.99",
  "currency": "USD",
  "payment_method": "stripe",
  "customer_note": "",
  "billing": { ... },
  "shipping": { ... },
  "items": [ ... ]
}
```

#### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 401 | `rest_forbidden` | Authentication required (no valid JWT) |
| 404 | `order_not_found` | Order does not exist or belongs to another customer |
| 503 | `woocommerce_required` | WooCommerce is not active |

---

## Error Reference

All errors follow the WordPress REST API error format:

```json
{
  "code": "rest_forbidden",
  "message": "Sorry, you are not allowed to do that.",
  "data": { "status": 401 }
}
```

| Code | Status | Description |
|------|--------|-------------|
| `rest_forbidden` | 401 | No valid JWT token provided |
| `woocommerce_required` | 503 | WooCommerce plugin is not active |
| `invalid_status` | 400 | Status parameter is not a recognized order status |
| `order_not_found` | 404 | Order does not exist or belongs to another customer |

---

## TypeScript / React Example

A complete orders client for a headless frontend:

```ts
// lib/orders.ts

const BASE = '/wp-json/headless-orders/v1';

interface OrderItem {
  product_id: number;
  variation_id: number;
  name: string;
  quantity: number;
  subtotal: string;
  total: string;
}

interface Address {
  first_name: string;
  last_name: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
}

interface BillingAddress extends Address {
  email: string;
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  created_at: string;
  updated_at: string;
  total: string;
  shipping_total: string;
  currency: string;
  payment_method: string;
  customer_note: string;
  billing: BillingAddress;
  shipping: Address;
  items: OrderItem[];
}

interface OrdersResult {
  orders: Order[];
  total: number;
  totalPages: number;
}

async function fetchOrders(params?: {
  status?: string;
  page?: number;
  perPage?: number;
}): Promise<OrdersResult> {
  const token = getJwtToken(); // Your JWT storage
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.perPage) query.set('per_page', String(params.perPage));

  const url = `${BASE}/orders${query.size ? `?${query}` : ''}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }

  return {
    orders: await res.json(),
    total: Number(res.headers.get('X-WP-Total') ?? '0'),
    totalPages: Number(res.headers.get('X-WP-TotalPages') ?? '1'),
  };
}

async function fetchOrder(id: number): Promise<Order> {
  const token = getJwtToken();
  const res = await fetch(`${BASE}/orders/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }

  return res.json();
}
```

Usage in a React component:

```tsx
import { useState, useEffect } from 'react';

function useOrders(params?: { status?: string; page?: number; perPage?: number }) {
  const [result, setResult] = useState<OrdersResult>({ orders: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchOrders(params)
      .then(setResult)
      .finally(() => setLoading(false));
  }, [params?.status, params?.page, params?.perPage]);

  return { ...result, loading };
}

function OrderHistory() {
  const [page, setPage] = useState(1);
  const { orders, total, totalPages, loading } = useOrders({ page, perPage: 10 });

  if (loading) return <p>Loading orders...</p>;
  if (!orders.length) return <p>No orders yet.</p>;

  return (
    <div>
      <p>{total} orders found</p>
      {orders.map((order) => (
        <div key={order.id}>
          <h3>Order #{order.order_number}</h3>
          <p>
            {order.status} &mdash; {order.currency} {order.total}
          </p>
          <ul>
            {order.items.map((item, i) => (
              <li key={i}>
                {item.name} x{item.quantity} &mdash; {order.currency} {item.total}
              </li>
            ))}
          </ul>
        </div>
      ))}
      {totalPages > 1 && (
        <nav>
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </nav>
      )}
    </div>
  );
}
```
