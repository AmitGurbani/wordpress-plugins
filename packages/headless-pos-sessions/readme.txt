=== Headless POS Sessions ===
Contributors: amitgurbani
Tags: pos, woocommerce, register, sessions, headless
Requires at least: 6.7
Tested up to: 6.9
Requires PHP: 8.2
Stable tag: 1.0.0
License: GPL-2.0+
License URI: https://www.gnu.org/licenses/gpl-2.0.html

POS register session storage with REST API for headless WordPress.

== Description ==

Headless POS Sessions provides a REST API for managing point-of-sale register sessions in headless WordPress stores. It stores cash register sessions as a custom post type and exposes full CRUD endpoints for opening, updating, and closing sessions from a POS frontend.

Each session tracks opening and closing balances, cash movements (in/out), linked WooCommerce order IDs, cashier assignment, and timestamped notes. UUID-based deduplication ensures safe syncing from offline-capable POS terminals.

**Headless-first design.** This plugin does not provide a POS frontend — it is the backend API layer for your custom POS application. Your frontend (React, Flutter, etc.) manages the register UI and calls these endpoints.

== Features ==

* Full CRUD REST API for register sessions (create, list, get, update, delete)
* Custom Post Type storage with structured meta fields (balances, orders, notes, cashier)
* UUID-based session deduplication for safe offline sync (409 Conflict on duplicate)
* Automatic daily cleanup of sessions older than configurable retention period
* Automatic daily auto-close of orphaned open sessions
* Pagination, filtering (by status, terminal, cashier, date range), and sorting on list endpoint
* WooCommerce capability-based permissions (edit_shop_orders, manage_woocommerce)
* Admin settings page for retention and auto-close configuration

== Requirements ==

* WordPress 6.7 or higher
* PHP 8.2 or higher
* WooCommerce (required for capability-based access control)

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/headless-pos-sessions` directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the **Plugins** screen in WordPress.
3. Go to **POS Sessions** in the admin menu to configure retention and auto-close settings.
4. Use the REST API endpoints from your POS frontend to manage sessions.

== Frequently Asked Questions ==

= Does this include a POS frontend? =

No. This plugin provides the backend REST API for session management. You build the register UI in your POS application (React, Flutter, etc.) and call the `/wp-json/headless-pos-sessions/v1/sessions` endpoints.

= How does offline sync work? =

Each session has a UUID (`session_uuid`). When your POS terminal syncs after being offline, the POST endpoint returns 409 Conflict if a session with that UUID already exists — preventing duplicates.

= What happens to old sessions? =

A daily cron job deletes closed sessions older than the configured retention period (default: 90 days). Another daily cron auto-closes orphaned open sessions that have been open longer than the auto-close threshold.

= What permissions are required? =

Creating, listing, and updating sessions requires the `edit_shop_orders` WooCommerce capability (Shop Manager or Admin). Deleting sessions requires `manage_woocommerce` (Admin only).

== Changelog ==

= 1.0.0 =
* Initial release
* REST endpoints: POST/GET/PUT/DELETE /sessions with pagination, filtering, and sorting
* Custom Post Type `pos_session` with structured meta fields
* UUID deduplication for offline sync
* Daily cron: retention cleanup and orphan auto-close
* Admin settings page with retention and auto-close configuration
