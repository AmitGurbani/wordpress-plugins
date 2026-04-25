# Integration Guide

Headless Fuzzy Find provides custom REST API endpoints for WooCommerce product search with weighted FULLTEXT matching, fuzzy correction, and autocomplete. This guide covers everything you need to integrate the search API into your storefront.

## Overview

Headless Fuzzy Find provides three public REST endpoints:

1. **Search** — paginated product search with weighted relevance scoring, fuzzy correction, and "did you mean" suggestions.
2. **Autocomplete** — lightweight product suggestions for search-as-you-type UIs.
3. **Popular Searches** — trending search terms (admin-curated overrides or top tracked queries) for storefront UIs.

The search and autocomplete endpoints query a FULLTEXT index directly — they do not hook into WP_Query or modify default WooCommerce search behavior. The popular-searches endpoint reads from the analytics log (or admin overrides if set).

**Base URL:** `https://your-site.com/wp-json/headless-fuzzy-find/v1`

If the site uses plain permalinks:
`https://your-site.com/?rest_route=/headless-fuzzy-find/v1`

## Search Endpoint

### Request

```http
GET /wp-json/headless-fuzzy-find/v1/search?query=shirt&page=1&per_page=10&orderby=relevance
```

```bash
curl "https://your-site.com/wp-json/headless-fuzzy-find/v1/search?query=shirt&page=1&per_page=10"
```

### Parameters

| Param | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| `query` | string | required | Search term (minimum 2 characters by default) |
| `page` | number | 1 | Page number for pagination |
| `per_page` | number | 10 | Results per page (max 100) |
| `orderby` | string | `relevance` | Sort order: `relevance` or `title` |

### Response

```json
{
  "results": [
    {
      "id": 42,
      "title": "Blue Oxford Shirt",
      "sku": "SHIRT-001",
      "price": "29.99",
      "price_html": "<span class=\"woocommerce-Price-amount amount\">...</span>",
      "permalink": "https://your-site.com/product/blue-oxford-shirt/",
      "image": "https://your-site.com/wp-content/uploads/shirt-150x150.jpg",
      "short_description": "A classic blue oxford shirt.",
      "relevance_score": 18.5
    }
  ],
  "total": 15,
  "total_pages": 2,
  "page": 1,
  "per_page": 10,
  "did_you_mean": []
}
```

| Field | Type | Description |
| ----- | ---- | ----------- |
| `results` | array | Array of product objects |
| `results[].id` | number | WooCommerce product ID |
| `results[].title` | string | Product title |
| `results[].sku` | string | Product SKU (empty string if not set) |
| `results[].price` | string | Raw price value |
| `results[].price_html` | string | Formatted price HTML from WooCommerce (pre-sanitized server-side) |
| `results[].permalink` | string | Full URL to the product page |
| `results[].image` | string | Thumbnail image URL (empty string if no image) |
| `results[].short_description` | string | Product short description (HTML stripped) |
| `results[].relevance_score` | number | Weighted relevance score (only present when `orderby=relevance`) |
| `total` | number | Total matching products |
| `total_pages` | number | Total pages available |
| `page` | number | Current page number |
| `per_page` | number | Results per page |
| `did_you_mean` | array | Suggested product titles when results are few or zero |

## Autocomplete Endpoint

### Request

```http
GET /wp-json/headless-fuzzy-find/v1/autocomplete?query=shirt&limit=5
```

```bash
curl "https://your-site.com/wp-json/headless-fuzzy-find/v1/autocomplete?query=shirt&limit=5"
```

### Parameters

| Param | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| `query` | string | required | Search term (minimum 2 characters by default) |
| `limit` | number | 8 | Maximum number of suggestions (max 50, configurable default in admin) |

### Response

```json
{
  "results": [
    {
      "id": 42,
      "title": "Blue Oxford Shirt",
      "sku": "SHIRT-001",
      "price": "29.99",
      "price_html": "<span class=\"woocommerce-Price-amount amount\">...</span>",
      "permalink": "https://your-site.com/product/blue-oxford-shirt/",
      "image": "https://your-site.com/wp-content/uploads/shirt-150x150.jpg"
    }
  ],
  "did_you_mean": []
}
```

| Field | Type | Description |
| ----- | ---- | ----------- |
| `results` | array | Array of product suggestion objects |
| `results[].id` | number | WooCommerce product ID |
| `results[].title` | string | Product title |
| `results[].sku` | string | Product SKU (empty string if not set) |
| `results[].price` | string | Raw price value |
| `results[].price_html` | string | Formatted price HTML from WooCommerce (pre-sanitized server-side) |
| `results[].permalink` | string | Full URL to the product page |
| `results[].image` | string | Thumbnail image URL (empty string if no image) |
| `did_you_mean` | array | Suggested product titles when results are few or zero |

## Popular Searches Endpoint

Returns trending search terms for storefront UIs (search page chips, autocomplete empty state, etc.). When admin overrides are set, they take precedence; otherwise the top tracked queries from the analytics log are returned.

### Request

```http
GET /wp-json/headless-fuzzy-find/v1/popular-searches?limit=8
```

```bash
curl "https://your-site.com/wp-json/headless-fuzzy-find/v1/popular-searches?limit=8"
```

### Parameters

| Param | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| `limit` | number | `popular_searches_max` setting (12) | Maximum number of items to return (clamped to 1-50) |

### Response

```json
{
  "items": ["shirt", "blue shirt", "oxford", "linen", "polo"]
}
```

| Field | Type | Description |
| ----- | ---- | ----------- |
| `items` | string[] | Trending search terms — admin overrides if set, otherwise top tracked queries with at least one result |

### Caching

This endpoint is cheap and changes slowly — cache it on the frontend for ~5 minutes. Unlike `/search`, it doesn't return WooCommerce product data, just strings.

### Source of Truth

- **If `popular_searches_override` is set** in admin (one term per line): items are the overrides, in order, capped at `limit`.
- **Otherwise:** items come from the analytics log (`headless_fuzzy_find_search_log`), filtering for queries that returned at least one result, ordered by `search_count` DESC.

The endpoint returns `{ "items": [] }` when both the overrides are empty and the analytics log has no qualifying entries.

## Error Responses

The search and autocomplete endpoints return standard WordPress REST API errors:

| Code | Status | Condition |
| ---- | ------ | --------- |
| `woocommerce_required` | 400 | WooCommerce is not active |
| `autocomplete_disabled` | 403 | Autocomplete is turned off in admin settings (autocomplete only) |

The popular-searches endpoint always returns 200 with `{ items: string[] }` — it does not require WooCommerce and does not error on empty data.

Error format:

```json
{
  "code": "woocommerce_required",
  "message": "WooCommerce is not active.",
  "data": { "status": 400 }
}
```

## Frontend Examples

### Vanilla JavaScript

```html
<div class="ff-search">
  <input type="text" id="ff-search-input" placeholder="Search products..." autocomplete="off" />
  <div id="ff-results" style="display: none;"></div>
</div>

<script>
const input = document.getElementById('ff-search-input');
const resultsEl = document.getElementById('ff-results');
let debounceTimer;

input.addEventListener('input', function () {
  clearTimeout(debounceTimer);
  const query = this.value.trim();

  if (query.length < 2) {
    resultsEl.style.display = 'none';
    return;
  }

  debounceTimer = setTimeout(() => {
    fetch(`/wp-json/headless-fuzzy-find/v1/autocomplete?query=${encodeURIComponent(query)}&limit=5`)
      .then(res => res.json())
      .then(data => {
        if (data.results.length === 0) {
          resultsEl.style.display = 'none';
          return;
        }

        // Clear previous results
        resultsEl.textContent = '';

        data.results.forEach(item => {
          const link = document.createElement('a');
          link.href = item.permalink;
          link.className = 'ff-result';

          if (item.image) {
            const img = document.createElement('img');
            img.src = item.image;
            img.alt = '';
            link.appendChild(img);
          }

          const info = document.createElement('div');
          const title = document.createElement('strong');
          title.textContent = item.title;
          const price = document.createElement('span');
          price.textContent = item.price;
          info.appendChild(title);
          info.appendChild(price);
          link.appendChild(info);

          resultsEl.appendChild(link);
        });

        resultsEl.style.display = 'block';
      });
  }, 300); // 300ms debounce
});

// Close on click outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.ff-search')) {
    resultsEl.style.display = 'none';
  }
});
</script>
```

### React Component

```tsx
import { useState, useEffect, useRef } from 'react';

interface Product {
  id: number;
  title: string;
  sku: string;
  price: string;
  price_html: string;
  permalink: string;
  image: string;
}

interface AutocompleteResponse {
  results: Product[];
  did_you_mean: string[];
}

function ProductSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      fetch(`/wp-json/headless-fuzzy-find/v1/autocomplete?query=${encodeURIComponent(query)}&limit=5`)
        .then(res => res.json())
        .then((data: AutocompleteResponse) => {
          setResults(data.results);
          setOpen(data.results.length > 0);
        });
    }, 300);

    return () => clearTimeout(timerRef.current);
  }, [query]);

  return (
    <div className="ff-search">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products..."
      />
      {open && (
        <ul className="ff-results">
          {results.map((item) => (
            <li key={item.id}>
              <a href={item.permalink}>
                {item.image && <img src={item.image} alt="" />}
                <strong>{item.title}</strong>
                <span>{item.price}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

> **Rendering `price_html`:** The response includes a `price_html` field with pre-formatted WooCommerce markup. It is sanitized server-side by WooCommerce's `get_price_html()`. If you choose to render it as HTML, sanitize it client-side with a library like [DOMPurify](https://github.com/cure53/DOMPurify) first. The examples above use the raw `price` field for simplicity.

## Search Behavior

### Query Processing

Search terms are converted to MySQL FULLTEXT boolean mode queries:

| Input | Boolean Query | Matches |
| ----- | ------------- | ------- |
| `shirt` | `+shirt*` | "Blue **Shirt**", "**Shirt**s for Men" |
| `blue shirt` | `+blue* +shirt*` | Products matching both "blue" AND "shirt" |
| `BDJ-001` | `+bdj-001*` | Exact SKU match |

### Synonym Expansion

If synonyms are configured (e.g., `tee, t-shirt, tshirt`), matching words are expanded:

| Input | Boolean Query |
| ----- | ------------- |
| `tee` | `+(tee* t-shirt* tshirt*)` |

### Search Fallback

For short words (under 3 characters, below MySQL's default `ft_min_word_len`), FULLTEXT may not match. Headless Fuzzy Find automatically falls back to `LIKE` pattern matching to ensure results.

### Fuzzy Correction

When a search returns zero results, Headless Fuzzy Find uses Levenshtein distance matching to correct misspelled words (edit distance ≤ 2) and retries the search with the corrected query.

### Indexed Fields

The FULLTEXT index covers these product fields:

| Field | Source |
| ----- | ------ |
| `title` | Product name |
| `sku` | Product SKU |
| `short_desc` | Short description (HTML stripped) |
| `attributes` | All product attribute values |
| `categories` | Product category names |
| `tags` | Product tag names |
| `variation_skus` | SKUs from all product variations (variable products) |

### Relevance Scoring

Results are ranked by a weighted relevance score:

```text
score = (title_match * title_weight)
      + (sku_match * sku_weight)
      + (full_match * content_weight)
```

Default weights: Title=10, SKU=8, Content=2. Configurable via admin settings.
