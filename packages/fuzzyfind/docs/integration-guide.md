# Integration Guide

FuzzyFind enhances WooCommerce product search with weighted FULLTEXT matching, fuzzy phonetic search, and a real-time autocomplete endpoint. This guide covers everything you need to integrate the search API into your storefront.

## Overview

FuzzyFind works at two levels:

1. **Automatic search enhancement** — hooks into `WP_Query` via the `posts_clauses` filter. Any standard WooCommerce product search (search widget, `?s=` URL param, `WP_Query` with `'s'`) is automatically enhanced. No code changes needed.

2. **Autocomplete REST endpoint** — a public `GET` endpoint that returns lightweight product suggestions for search-as-you-type UIs.

**Base URL:** `https://your-site.com/wp-json/fuzzyfind/v1`

If the site uses plain permalinks:
`https://your-site.com/?rest_route=/fuzzyfind/v1`

## Automatic Search Enhancement

Once the plugin is activated and the index is built, WooCommerce product searches are automatically enhanced:

- Standard search queries are intercepted on the main query
- Results are matched against a FULLTEXT index covering title, SKU, description, attributes, categories, tags, and variation SKUs
- Results are ranked by a weighted relevance score (configurable in admin)
- Search terms are logged for analytics (if enabled)

**No frontend code changes are needed.** Existing search forms, search widgets, and theme search templates will automatically return better results.

## Autocomplete Endpoint

### Request

```http
GET /wp-json/fuzzyfind/v1/autocomplete?query=shirt&limit=5
```

```bash
curl "https://your-site.com/wp-json/fuzzyfind/v1/autocomplete?query=shirt&limit=5"
```

### Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `query` | string | required | Search term (minimum 2 characters by default) |
| `limit` | number | 8 | Maximum number of suggestions (configurable in admin) |

### Response

```json
[
  {
    "id": 42,
    "title": "Blue Oxford Shirt",
    "sku": "SHIRT-001",
    "price": "29.99",
    "price_html": "<span class=\"woocommerce-Price-amount amount\">...</span>",
    "permalink": "https://your-site.com/product/blue-oxford-shirt/",
    "image": "https://your-site.com/wp-content/uploads/shirt-150x150.jpg"
  },
  {
    "id": 87,
    "title": "Red Flannel Shirt",
    "sku": "SHIRT-042",
    "price": "34.99",
    "price_html": "...",
    "permalink": "https://your-site.com/product/red-flannel-shirt/",
    "image": "https://your-site.com/wp-content/uploads/flannel-150x150.jpg"
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | WooCommerce product ID |
| `title` | string | Product title |
| `sku` | string | Product SKU (empty string if not set) |
| `price` | string | Raw price value |
| `price_html` | string | Formatted price HTML from WooCommerce (pre-sanitized server-side) |
| `permalink` | string | Full URL to the product page |
| `image` | string | Thumbnail image URL (empty string if no image) |

Returns an empty array `[]` when there are no results or the query is too short.

### Error Responses

| Code | Status | Condition |
|------|--------|-----------|
| `woocommerce_required` | 400 | WooCommerce is not active |
| `autocomplete_disabled` | 403 | Autocomplete is turned off in admin settings |

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
    fetch(`/wp-json/fuzzyfind/v1/autocomplete?query=${encodeURIComponent(query)}&limit=5`)
      .then(res => res.json())
      .then(items => {
        if (items.length === 0) {
          resultsEl.style.display = 'none';
          return;
        }

        // Clear previous results
        resultsEl.textContent = '';

        items.forEach(item => {
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
      fetch(`/wp-json/fuzzyfind/v1/autocomplete?query=${encodeURIComponent(query)}&limit=5`)
        .then(res => res.json())
        .then(items => {
          setResults(items);
          setOpen(items.length > 0);
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
|-------|---------------|---------|
| `shirt` | `+shirt*` | "Blue **Shirt**", "**Shirt**s for Men" |
| `blue shirt` | `+blue* +shirt*` | Products matching both "blue" AND "shirt" |
| `BDJ-001` | `+bdj-001*` | Exact SKU match |

### Search Fallback

For short words (under 3 characters, below MySQL's default `ft_min_word_len`), FULLTEXT may not match. FuzzyFind automatically falls back to `LIKE` pattern matching to ensure results.

### Indexed Fields

The FULLTEXT index covers these product fields:

| Field | Source |
|-------|--------|
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
