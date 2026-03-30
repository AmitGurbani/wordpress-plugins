import {
  test as base,
  type APIRequestContext,
  request as playwrightRequest,
} from '@playwright/test';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const E2E_DIR = path.resolve(__dirname, '..');
const BASE_URL = 'http://localhost:8889';
const STORAGE_STATE = path.resolve(
  E2E_DIR,
  'artifacts/storage-states/admin.json',
);

/**
 * Run a WP-CLI command against the wp-env test instance.
 * Only called with hardcoded strings — no user input, no injection risk.
 */
export function wpCli(command: string): string {
  return execSync(`pnpm wp-env run tests-cli wp ${command}`, {
    cwd: E2E_DIR,
    encoding: 'utf-8',
    timeout: 60_000,
  }).trim();
}

export class RestApiClient {
  constructor(
    private request: APIRequestContext,
    private baseURL: string = BASE_URL,
  ) {}

  async getSettings(slug: string) {
    const res = await this.request.get(
      `${this.baseURL}/wp-json/${slug}/v1/settings`,
    );
    return { status: res.status(), data: await res.json() };
  }

  async updateSettings(slug: string, data: Record<string, unknown>) {
    const res = await this.request.post(
      `${this.baseURL}/wp-json/${slug}/v1/settings`,
      { data },
    );
    return { status: res.status(), data: await res.json() };
  }

  async getConfig(slug: string) {
    const res = await this.request.get(
      `${this.baseURL}/wp-json/${slug}/v1/config`,
    );
    return { status: res.status(), data: await res.json() };
  }

  async getDiagnostics(slug: string) {
    const res = await this.request.get(
      `${this.baseURL}/wp-json/${slug}/v1/diagnostics/last-error`,
    );
    return { status: res.status(), data: await res.json() };
  }

  async get(path: string) {
    const res = await this.request.get(`${this.baseURL}/wp-json/${path}`);
    return { status: res.status(), data: await res.json() };
  }

  async post(path: string, data?: Record<string, unknown>) {
    const res = await this.request.post(`${this.baseURL}/wp-json/${path}`, {
      data,
    });
    return { status: res.status(), data: await res.json() };
  }
}

type WpFixtures = {
  wpCli: (command: string) => string;
  restApi: RestApiClient;
};

export const test = base.extend<{}, WpFixtures>({
  wpCli: [
    async ({}, use) => {
      await use(wpCli);
    },
    { scope: 'worker' },
  ],
  restApi: [
    async ({}, use) => {
      // Read the nonce from storage state — WordPress REST API requires
      // X-WP-Nonce header for cookie-authenticated POST/PUT/DELETE requests
      const state = JSON.parse(fs.readFileSync(STORAGE_STATE, 'utf-8'));
      const ctx = await playwrightRequest.newContext({
        baseURL: BASE_URL,
        storageState: STORAGE_STATE,
        extraHTTPHeaders: {
          'X-WP-Nonce': state.nonce,
        },
      });
      await use(new RestApiClient(ctx));
      await ctx.dispose();
    },
    { scope: 'worker' },
  ],
});

export { expect } from '@playwright/test';
