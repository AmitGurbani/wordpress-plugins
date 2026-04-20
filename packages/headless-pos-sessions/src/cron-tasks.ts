/**
 * Cron Tasks
 *
 * Daily scheduled tasks for session retention cleanup and orphan auto-close.
 */

import { Action } from 'wpts';

class CronTasks {
  // ── Daily cleanup: delete closed sessions older than retention_days ────

  @Action('headless_pos_sessions_daily_cleanup')
  cleanupOldSessions(): void {
    const retentionDays: number = intval(getOption('headless_pos_sessions_retention_days', 90));
    if (retentionDays <= 0) {
      return;
    }

    const cutoffTimestamp: number = time() - retentionDays * 86400;
    const cutoffDate: string = gmdate('c', cutoffTimestamp);

    const oldSessions: any[] = getPosts({
      post_type: 'hpss_pos_session',
      post_status: 'publish',
      posts_per_page: 100,
      meta_query: [
        { key: '_session_status', value: 'closed' },
        { key: '_closed_at', value: cutoffDate, compare: '<', type: 'CHAR' },
      ],
      fields: 'ids',
    });

    for (const sessionId of oldSessions) {
      wpDeletePost(intval(sessionId), true);
    }
  }

  // ── Daily auto-close: close orphaned open sessions older than 24h ─────

  @Action('headless_pos_sessions_daily_auto_close')
  autoCloseOrphanedSessions(): void {
    const cutoffTimestamp: number = time() - 86400;
    const cutoffDate: string = gmdate('c', cutoffTimestamp);

    const orphanedSessions: any[] = getPosts({
      post_type: 'hpss_pos_session',
      post_status: 'publish',
      posts_per_page: 100,
      meta_query: [
        { key: '_session_status', value: 'open' },
        { key: '_opened_at', value: cutoffDate, compare: '<', type: 'CHAR' },
      ],
      fields: 'ids',
    });

    const now: string = gmdate('c', time());
    for (const sessionId of orphanedSessions) {
      const id: number = intval(sessionId);
      updatePostMeta(id, '_session_status', 'closed');
      updatePostMeta(id, '_closed_at', now);
      updatePostMeta(id, '_notes', 'Auto-closed: orphaned session');
    }
  }
}
