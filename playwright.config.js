const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60_000,
  use: {
    baseURL: 'https://www.facebook.com',
    trace: 'on',
    screenshot: 'on',
  },
  projects: [
    {
      name: 'chromium', // keeps your npm scripts working
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
});