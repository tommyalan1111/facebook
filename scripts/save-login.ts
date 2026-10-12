import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

/**
 * Opens a real Chrome window so YOU can log in by hand (including any 2FA or
 * captcha), then saves the session (cookies + local storage) to auth/user.json.
 * No credentials are typed or stored by this script.
 *
 * Run:  npm run auth:save
 */
const LOGIN_URL = 'https://www.facebook.com/?locale=vi_VN';
const AUTH_FILE = path.join('auth', 'user.json');

function waitForEnter(message: string): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(message, () => {
      rl.close();
      resolve();
    });
  });
}

async function main(): Promise<void> {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  // Installed Google Chrome (signed), not the bundled Chromium that Windows blocked
  const browser = await chromium.launch({ channel: 'chrome', headless: false });
  const context = await browser.newContext({ locale: 'vi-VN' });
  const page = await context.newPage();
  await page.goto(LOGIN_URL);

  console.log('\n1. Log in manually in the browser window (finish any 2FA or captcha).');
  console.log('2. Wait until you can see your Facebook home page.');
  await waitForEnter('3. Come back here and press Enter to save the session... ');

  await context.storageState({ path: AUTH_FILE });
  console.log(`\nSession saved to ${AUTH_FILE}`);

  await browser.close();
}

main().catch((error) => {
  console.error('Failed to save the session:', error);
  process.exit(1);
});