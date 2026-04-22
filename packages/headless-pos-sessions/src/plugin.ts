/**
 * Headless POS Sessions — wpts Plugin
 *
 * POS register session storage with REST API for headless WordPress.
 * Stores cash register open/close events, cash movements, and order history.
 *
 * Build: npx wpts build src/plugin.ts -o dist --clean
 */

import {
  Action,
  Activate,
  AdminPage,
  CustomPostType,
  Deactivate,
  Plugin,
  Setting,
} from '@amitgurbani/wpts';
import './session-routes.js';
import './cron-tasks.js';

@Plugin({
  name: 'Headless POS Sessions',
  uri: 'https://github.com/AmitGurbani/wordpress-plugins',
  description: 'POS register session storage with REST API for headless WordPress.',
  version: '1.1.0',
  author: 'Amit Gurbani',
  authorUri: 'https://github.com/AmitGurbani',
  license: 'GPL-2.0+',
  textDomain: 'headless-pos-sessions',
  wooNotice: 'required',
})
@CustomPostType('hpss_pos_session', {
  singularName: 'POS Session',
  pluralName: 'POS Sessions',
  public: false,
  showInRest: false,
  hasArchive: false,
  supports: ['title'],
})
@AdminPage({
  pageTitle: 'POS Sessions Settings',
  menuTitle: 'POS Sessions',
  capability: 'manage_options',
  menuSlug: 'headless-pos-sessions-settings',
  iconUrl: 'dashicons-store',
})
class HeadlessPosSessionsPlugin {
  // ── Settings ──────────────────────────────────────────────────────────

  @Setting({
    key: 'retention_days',
    type: 'number',
    default: 90,
    label: 'Retention Days',
    description: 'Auto-delete closed sessions older than N days. Set to 0 to disable.',
  })
  retentionDays: number = 90;

  @Setting({
    key: 'max_open_sessions',
    type: 'number',
    default: 10,
    label: 'Max Open Sessions',
    description: 'Maximum number of concurrently open POS sessions.',
  })
  maxOpenSessions: number = 10;

  // ── Cron Scheduling ───────────────────────────────────────────────────

  @Action('init')
  scheduleCronJobs(): void {
    if (!wpNextScheduled('headless_pos_sessions_daily_cleanup')) {
      wpScheduleEvent(time(), 'daily', 'headless_pos_sessions_daily_cleanup');
    }
    if (!wpNextScheduled('headless_pos_sessions_daily_auto_close')) {
      wpScheduleEvent(time(), 'daily', 'headless_pos_sessions_daily_auto_close');
    }
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────

  @Activate()
  onActivation(): void {
    // CPT auto-registered by @CustomPostType on init
    // Settings auto-defaulted by @Setting
  }

  @Deactivate()
  onDeactivation(): void {
    wpClearScheduledHook('headless_pos_sessions_daily_cleanup');
    wpClearScheduledHook('headless_pos_sessions_daily_auto_close');
  }
}
