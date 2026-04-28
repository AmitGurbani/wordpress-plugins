/**
 * Headless Storefront Revalidate Hooks
 *
 * Option-update hooks that fire the frontend revalidation webhook.
 * Kept in a dedicated class so the shared helper lands in the Public PHP
 * class alongside the action handlers (wpts places helpers in ONE class
 * per source class; mixing @Action + @RestRoute in one TS class would put
 * the helper in the REST class, unreachable from the action handlers).
 */

import { Action } from '@amitgurbani/wpts';

class RevalidateHooks {
  // ── Hooks that trigger revalidation ────────────────────────────────

  @Action('update_option_headless_storefront_config', { acceptedArgs: 1 })
  onConfigUpdate(_oldValue: any): void {
    this.dispatchRevalidate();
  }

  @Action('update_option_blogname', { acceptedArgs: 1 })
  onBlogNameUpdate(_oldValue: any): void {
    this.dispatchRevalidate();
  }

  @Action('update_option_blogdescription', { acceptedArgs: 1 })
  onBlogDescriptionUpdate(_oldValue: any): void {
    this.dispatchRevalidate();
  }

  @Action('update_option_woocommerce_email_from_address', { acceptedArgs: 1 })
  onWooEmailUpdate(_oldValue: any): void {
    this.dispatchRevalidate();
  }

  // ── Shared helper: dispatch revalidation webhook ───────────────────

  dispatchRevalidate(): boolean {
    // Skip during WP-CLI runs (e.g. `wp option update` seed scripts).
    if (defined('WP_CLI') && WP_CLI) {
      return false;
    }

    const config: any = getOption('headless_storefront_config', []);
    const frontendUrl: string = config.frontend_url ?? '';
    const secret: string = config.revalidate_secret ?? '';

    if (!frontendUrl || !secret) {
      return false;
    }

    // Record "last attempted" before firing. Dispatch is fire-and-forget so
    // success isn't observable; this answers "did the hook ever fire?" for
    // admins. Stored in a separate option to avoid re-entering the
    // update_option_headless_storefront_config action.
    updateOption('headless_storefront_last_revalidate_at', gmdate('c', time()));

    // Fire-and-forget: blocking: false means WP dispatches the request
    // without waiting for a response, so status is not observable here.
    wpSafeRemotePost(`${frontendUrl}/api/revalidate`, {
      body: jsonEncode({ type: 'storefront' }),
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret': secret,
      },
      blocking: false,
      timeout: 5,
    });

    if (defined('WP_DEBUG_LOG') && WP_DEBUG_LOG) {
      errorLog(`[headless-storefront] revalidate dispatched to ${frontendUrl}/api/revalidate`);
    }

    return true;
  }
}
