=== Headless Auth ===
Contributors: amitgurbani
Tags: otp, authentication, jwt, headless, rest-api
Requires at least: 6.7
Tested up to: 6.9
Requires PHP: 8.2
Stable tag: 1.2.2
License: GPL-2.0+
License URI: https://www.gnu.org/licenses/gpl-2.0.html

OTP and password authentication with JWT tokens for headless WordPress and mobile apps.

== Description ==

Headless Auth provides two authentication methods for headless WordPress stores and mobile applications: phone-based OTP login and username/email + password login. Both methods issue JWT access and refresh tokens for secure API access.

The plugin generates OTPs locally and delivers them via a configurable external server (SMS gateway, WhatsApp API, etc.). JWT tokens are signed with HS256 and automatically managed by the plugin. The access token/refresh token model enables secure, long-lived sessions with short-lived credentials.

WooCommerce integration activates automatically when WooCommerce is installed: new users receive the `customer` role, billing metadata is pre-populated from their profile, and existing WooCommerce customers can authenticate by their billing phone number.

== Features ==

* Username/email + password login via REST API
* Phone number OTP authentication via REST API
* JWT access tokens (short-lived, configurable) + refresh tokens (long-lived, rotated on use)
* New user registration flow with name capture
* Configurable OTP delivery via any external server (SMS, WhatsApp, etc.) using JSON template configuration
* Rate limiting and brute-force protection (configurable per-phone limits and lockout windows)
* WooCommerce integration — customer role, billing metadata sync, existing customer lookup by billing phone
* Test mode for development — OTPs generated locally without delivery, viewable via admin endpoint
* CORS support for browser-based applications
* Admin settings page with OTP, Login, Security, Authentication, and Advanced tabs

== Requirements ==

* WordPress 6.7 or higher
* PHP 8.2 or higher
* An external OTP delivery server (SMS gateway, WhatsApp API, etc.) that accepts POST requests

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/headless-auth` directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the **Plugins** screen in WordPress.
3. Go to **Settings > Permalinks** and click **Save Changes** to flush rewrite rules (recommended).
4. Go to **Auth** in the admin menu to configure authentication settings (OTP delivery, password login, security, and more).

A JWT secret key is generated automatically on activation. No manual key configuration is needed.

== Frequently Asked Questions ==

= What OTP delivery service does this support? =

The plugin sends OTPs to any HTTP server that accepts a POST request with a JSON body. You configure the URL, headers, and payload template — the `{{phone}}` and `{{otp}}` placeholders are replaced at send time. This works with Twilio, MSG91, WhatsApp Business API, or any custom delivery endpoint.

= How do JWT tokens work? =

After successful OTP verification, the plugin issues two tokens: a short-lived access token (default: 1 hour) and a long-lived refresh token (default: 7 days). Use the access token in the `Authorization: Bearer` header. When it expires, use the refresh token to get a new pair via `/auth/refresh`. Both tokens are rotated on every refresh.

= What happens to existing WooCommerce customers? =

When WooCommerce is active, existing customers who registered through checkout can authenticate with their billing phone number — even if they've never used OTP auth before. The plugin looks up users by `billing_phone` as a fallback.

= Can I disable new user registration? =

Yes. Turn off **Enable New User Registration** in the Authentication tab. Unrecognized phone numbers will receive a `registration_disabled` response instead of a registration token.

== Third Party Services ==

This plugin sends data to an external OTP delivery server that you configure in the plugin settings:

* **What is sent**: Phone number and OTP code, plus any data included in your custom payload template (site name, site URL)
* **When**: Every time an OTP is requested via the `/otp/send` endpoint
* **Where**: The URL you configure in Settings > OTP Server URL (e.g., Twilio, MSG91, WhatsApp Business API, or any custom endpoint)

No data is sent to any external service until you configure an OTP server URL. In test mode, OTPs are generated locally and no external requests are made.

You are responsible for reviewing the privacy policy and terms of service of the OTP delivery provider you choose.

== Changelog ==

= 1.0.0 =
* Initial release
* REST endpoints: `POST /auth/login`, `POST /otp/send`, `POST /otp/verify`, `POST /auth/register`, `POST /auth/refresh`, `GET /auth/me`
* JWT HS256 access and refresh tokens with automatic secret key generation
* Configurable OTP delivery via JSON template (URL, headers, payload with `{{phone}}` and `{{otp}}` placeholders)
* Rate limiting: send cooldown, max send attempts, verify attempt lockout
* WooCommerce integration: customer role, billing meta sync, billing phone lookup fallback
* Test mode with admin-only OTP retrieval endpoint
* CORS configuration for browser-based apps
* Admin settings page with OTP, Login, Security, Authentication, and Advanced tabs
