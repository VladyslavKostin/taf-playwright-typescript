import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

const WEB_BASE_URL = process.env.WEB_BASE_URL ?? 'https://automationexercise.com';
// Trailing slash required — see src/core/config.ts's comment on the same default.
const API_BASE_URL = process.env.API_BASE_URL ?? 'https://automationexercise.com/api/';
const isCI = !!process.env.CI;

export default defineConfig({
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }], ...(isCI ? [['github'] as const] : [])],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'component',
      testDir: './tests/component',
      use: { ...devices['Desktop Chrome'], baseURL: WEB_BASE_URL },
    },
    {
      name: 'api',
      testDir: './tests/api',
      use: { ...devices['Desktop Chrome'], baseURL: API_BASE_URL },
    },
    {
      name: 'e2e',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Chrome'], baseURL: WEB_BASE_URL },
    },
  ],
});
