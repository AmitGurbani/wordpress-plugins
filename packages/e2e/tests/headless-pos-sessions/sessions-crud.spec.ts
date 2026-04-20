import fs from 'node:fs';
import path from 'node:path';
import { request as playwrightRequest } from '@playwright/test';
import { expect, test } from '../../fixtures/wordpress';

const STORAGE_STATE = path.resolve(__dirname, '../../artifacts/storage-states/admin.json');

const SLUG = 'headless-pos-sessions';
const BASE = `http://localhost:8889/wp-json/${SLUG}/v1`;
const RUN_ID = Date.now().toString(36);

const SESSION_DATA = {
  session_uuid: `test-session-${RUN_ID}-001`,
  terminal_id: 'browser-test-001',
  opened_at: '2026-04-01T09:00:00.000Z',
  opening_balance: 200.0,
  closed_at: '2026-04-01T17:30:00.000Z',
  closing_balance: 485.5,
  expected_balance: 490.0,
  cash_in: 340.0,
  cash_out: 50.0,
  order_count: 3,
  order_ids: [1001, 1002, 1003],
  notes: 'Short $4.50 — suspect miscounted change',
};

test.describe('Headless POS Sessions — Sessions CRUD', () => {
  let createdId: number;

  test.beforeAll(async ({ wpCli }) => {
    // Clean up leftover sessions from previous test runs
    const ids = wpCli('post list --post_type=hpss_pos_session --format=ids');
    if (ids.trim()) {
      wpCli(`post delete ${ids.trim()} --force`);
    }
  });

  test('POST /sessions creates a session', async ({ restApi }) => {
    const { status, data } = await restApi.post(`${SLUG}/v1/sessions`, SESSION_DATA);
    expect(status).toBe(200);
    expect(data.session_uuid).toBe(SESSION_DATA.session_uuid);
    expect(data.terminal_id).toBe(SESSION_DATA.terminal_id);
    expect(data.status).toBe('closed');
    expect(data.opened_at).toBe(SESSION_DATA.opened_at);
    expect(data.closed_at).toBe(SESSION_DATA.closed_at);
    expect(data.opening_balance).toBe(200);
    expect(data.closing_balance).toBe(485.5);
    expect(data.expected_balance).toBe(490);
    expect(data.cash_in).toBe(340);
    expect(data.cash_out).toBe(50);
    expect(data.order_count).toBe(3);
    expect(data.order_ids).toEqual([1001, 1002, 1003]);
    expect(data.notes).toContain('Short');
    expect(data.cashier_id).toBeGreaterThan(0);
    expect(data.created_at).toBeDefined();
    createdId = data.id;
  });

  test('POST /sessions with duplicate UUID returns 409', async ({ restApi }) => {
    const { status, data } = await restApi.post(`${SLUG}/v1/sessions`, SESSION_DATA);
    expect(status).toBe(409);
    expect(data.code).toBe('duplicate_uuid');
  });

  test('POST /sessions without required fields returns 400', async ({ restApi }) => {
    const { status: s1 } = await restApi.post(`${SLUG}/v1/sessions`, {});
    expect(s1).toBe(400);

    const { status: s2 } = await restApi.post(`${SLUG}/v1/sessions`, {
      session_uuid: `test-missing-terminal-${RUN_ID}`,
    });
    expect(s2).toBe(400);

    const { status: s3 } = await restApi.post(`${SLUG}/v1/sessions`, {
      session_uuid: `test-missing-opened-${RUN_ID}`,
      terminal_id: 'term-1',
    });
    expect(s3).toBe(400);
  });

  test('POST /sessions with negative opening_balance returns 400', async ({ restApi }) => {
    const { status } = await restApi.post(`${SLUG}/v1/sessions`, {
      session_uuid: `test-negative-balance-${RUN_ID}`,
      terminal_id: 'term-1',
      opened_at: '2026-04-01T09:00:00.000Z',
      opening_balance: -50,
    });
    expect(status).toBe(400);
  });

  test('POST /sessions without closed_at creates an open session', async ({ restApi }) => {
    const { status, data } = await restApi.post(`${SLUG}/v1/sessions`, {
      session_uuid: `open-session-${RUN_ID}-001`,
      terminal_id: 'browser-test-002',
      opened_at: '2026-04-02T08:00:00.000Z',
      opening_balance: 100,
    });
    expect(status).toBe(200);
    expect(data.status).toBe('open');
    expect(data.cash_in).toBe(0);
    expect(data.cash_out).toBe(0);
    expect(data.order_count).toBe(0);
    expect(data.order_ids).toEqual([]);
  });

  test('GET /sessions lists sessions', async ({ restApi }) => {
    const { status, data } = await restApi.get(`${SLUG}/v1/sessions`);
    expect(status).toBe(200);
    expect(data.data).toBeDefined();
    expect(data.meta).toBeDefined();
    expect(data.meta.total).toBeGreaterThanOrEqual(2);
    expect(data.meta.page).toBe(1);
    expect(data.meta.per_page).toBe(20);
  });

  test('GET /sessions filters by status', async ({ restApi }) => {
    const { data: closed } = await restApi.get(`${SLUG}/v1/sessions?status=closed`);
    for (const s of closed.data) {
      expect(s.status).toBe('closed');
    }

    const { data: open } = await restApi.get(`${SLUG}/v1/sessions?status=open`);
    for (const s of open.data) {
      expect(s.status).toBe('open');
    }
  });

  test('GET /sessions filters by terminal_id', async ({ restApi }) => {
    const { data } = await restApi.get(`${SLUG}/v1/sessions?terminal_id=browser-test-001`);
    expect(data.data.length).toBeGreaterThanOrEqual(1);
    for (const s of data.data) {
      expect(s.terminal_id).toBe('browser-test-001');
    }
  });

  test('GET /sessions supports pagination', async ({ restApi }) => {
    const { data } = await restApi.get(`${SLUG}/v1/sessions?per_page=1&page=1`);
    expect(data.data.length).toBe(1);
    expect(data.meta.per_page).toBe(1);
  });

  test('GET /sessions/:id returns a single session', async ({ restApi }) => {
    const { status, data } = await restApi.get(`${SLUG}/v1/sessions/${createdId}`);
    expect(status).toBe(200);
    expect(data.id).toBe(createdId);
    expect(data.session_uuid).toBe(SESSION_DATA.session_uuid);
  });

  test('GET /sessions/:id returns 404 for missing session', async ({ restApi }) => {
    const { status } = await restApi.get(`${SLUG}/v1/sessions/999999`);
    expect(status).toBe(404);
  });

  test('PUT /sessions/:id updates session (partial)', async ({ restApi }) => {
    const { status, data } = await restApi.post(`${SLUG}/v1/sessions`, {
      session_uuid: `update-test-${RUN_ID}`,
      terminal_id: 'browser-test-003',
      opened_at: '2026-04-03T09:00:00.000Z',
      opening_balance: 150,
    });
    expect(status).toBe(200);
    const updateId = data.id;

    // Use raw fetch for PUT (restApi helper only has get/post)
    const ctx = await playwrightRequest.newContext({
      storageState: STORAGE_STATE,
      extraHTTPHeaders: {
        'X-WP-Nonce': JSON.parse(fs.readFileSync(STORAGE_STATE, 'utf-8')).nonce,
      },
    });
    const res = await ctx.put(`${BASE}/sessions/${updateId}`, {
      data: {
        closed_at: '2026-04-03T17:00:00.000Z',
        closing_balance: 350,
        notes: 'Shift complete',
        status: 'closed',
      },
    });
    expect(res.status()).toBe(200);
    const updated = await res.json();
    expect(updated.closed_at).toBe('2026-04-03T17:00:00.000Z');
    expect(updated.closing_balance).toBe(350);
    expect(updated.notes).toBe('Shift complete');
    expect(updated.status).toBe('closed');
    // Unchanged fields should persist
    expect(updated.opening_balance).toBe(150);
    await ctx.dispose();
  });

  test('DELETE /sessions/:id requires manage_woocommerce', async ({ restApi }) => {
    // Admin user has manage_woocommerce by default in WooCommerce
    const { status, data } = await restApi.post(`${SLUG}/v1/sessions`, {
      session_uuid: `delete-test-${RUN_ID}`,
      terminal_id: 'browser-test-004',
      opened_at: '2026-04-04T09:00:00.000Z',
      opening_balance: 100,
    });
    expect(status).toBe(200);
    const deleteId = data.id;

    const ctx = await playwrightRequest.newContext({
      storageState: STORAGE_STATE,
      extraHTTPHeaders: {
        'X-WP-Nonce': JSON.parse(fs.readFileSync(STORAGE_STATE, 'utf-8')).nonce,
      },
    });
    const res = await ctx.delete(`${BASE}/sessions/${deleteId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
    expect(body.id).toBe(deleteId);
    await ctx.dispose();

    // Verify session is gone
    const { status: getStatus } = await restApi.get(`${SLUG}/v1/sessions/${deleteId}`);
    expect(getStatus).toBe(404);
  });

  test('Unauthenticated requests return 401', async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${BASE}/sessions`);
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });
});
