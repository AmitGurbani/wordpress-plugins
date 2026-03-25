# Admin Guide

Setup and configuration guide for WordPress site administrators.

## Installation

1. Download the plugin zip file
2. Go to **Plugins > Add New > Upload Plugin** in WordPress admin
3. Upload the zip and click **Install Now**
4. Click **Activate**

**Recommended:** Go to **Settings > Permalinks** and select "Post name" (or any option other than "Plain"). This enables clean REST API URLs (`/wp-json/...`). The API also works with plain permalinks using the `?rest_route=/headless-clarity/v1/...` format.

After activation, a **Microsoft Clarity** menu item appears in the WordPress admin sidebar.

## Getting Your Project ID

1. Go to [clarity.microsoft.com](https://clarity.microsoft.com) and sign in (free)
2. Select your project (or create a new one)
3. Go to **Settings** > **Overview**
4. Copy the **Project ID** — a 10-character alphanumeric string (e.g., `abcdefghij`)

## Settings Reference

Access settings via the **Microsoft Clarity** menu in WordPress admin. Settings are organized into two tabs.

### General Tab

| Setting | Default | Description |
| ------- | ------- | ----------- |
| Clarity Project ID | — | Your 10-character alphanumeric Project ID from the Clarity dashboard. Required for the `/config` endpoint |
| Enable User Identification | On | Expose logged-in user ID and display name via the `/config` endpoint, allowing the frontend to call `clarity("identify", ...)` for cross-device user tracking |

### Diagnostics Tab

Tools for debugging:

- **Fetch Last Error** — Shows the most recent error logged by the plugin

Note: Unlike other analytics plugins in this monorepo, there is no "Test Connection" button because Clarity has no server-side API to test against. Verification is done in the Clarity dashboard.

## Verifying the Setup

Since Clarity has no server-side API, verification happens in the browser:

1. In WordPress: **Microsoft Clarity** > **General** tab > enter your **Project ID** > Save
2. Visit your headless frontend and open browser DevTools
3. Check the **Network** tab for requests to `https://www.clarity.ms/collect` — these confirm Clarity is active
4. Check the **Clarity dashboard** for live recordings appearing

You can also verify the REST API directly:

```bash
curl https://your-site.com/wp-json/headless-clarity/v1/config
```

Expected response:

```json
{
  "project_id": "abcdefghij"
}
```

## Troubleshooting

### 404 on API endpoints

1. If using pretty permalinks: go to **Settings > Permalinks** and click **Save Changes** (this flushes rewrite rules)
2. If using plain permalinks: replace `/wp-json/headless-clarity/v1/...` with `?rest_route=/headless-clarity/v1/...`

### No recordings in Clarity dashboard

1. Check that **Project ID** is filled in — the frontend cannot initialize the Clarity script without it
2. Verify the Project ID matches the one in your Clarity dashboard (Settings > Overview)
3. Open your frontend in a browser and check DevTools Network tab for `clarity.ms` requests
4. Ensure the Clarity tracking script is loading (check for `https://www.clarity.ms/tag/{project_id}` in the page source)

### User identification not working

1. Confirm **Enable User Identification** is turned on in the General tab
2. The user must be logged in to WordPress — the `/config` endpoint only includes user data for authenticated requests
3. Your frontend must pass authentication (cookie or nonce) when calling `/config` for WordPress to recognize the logged-in user
4. Verify by calling `/config` while logged in — the response should include a `user` object

### Clarity and cookie consent

If you serve users in the EEA, UK, or Switzerland, Clarity requires a consent signal. Your frontend must call `clarity("consentv2", { ad_Storage, analytics_Storage })` based on the user's consent choice. Without consent, Clarity operates in restricted mode (no cookies, no cross-page session linking). See the [Integration Guide](integration-guide.md#cookie-consent) for details.
