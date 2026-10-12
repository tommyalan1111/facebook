import { expect, type Locator, type Page } from '@playwright/test';

/** Accessible name of the Like button of a post that has not been liked yet. */
const LIKE_LABEL = /^Bày tỏ cảm xúc Thích về bài viết của/;

/** Result of liking a post: a tag to find the button again, and its original label. */
export interface LikedPost {
  tag: string;
  label: string;
}

/**
 * Page Object for the logged-in Facebook home page (news feed).
 * Needs a saved session: test.use({ storageState: 'auth/user.json' }).
 *
 * In this version of the page, posts are NOT role="article" (the only articles are the
 * "Đang tải..." loading placeholders) and the Like button is named
 * "Bày tỏ cảm xúc Thích về bài viết của <author>", not just "Thích".
 * So posts are located through their action buttons, which every loaded post has.
 */
export class HomePage {
  static readonly PATH = '/';

  readonly page: Page;
  readonly mainContent: Locator;
  readonly feedHeading: Locator;
  /** One per loaded post: its "Bình luận về bài viết của <author>" button. */
  readonly commentButtons: Locator;
  /** One per loaded post that has not been liked yet. */
  readonly likeButtons: Locator;
  readonly rememberPasswordLaterButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.mainContent = page.getByRole('main');
    this.feedHeading = page.getByRole('heading', { name: 'Bài viết trên Bảng feed' });
    this.commentButtons = page.getByRole('button', { name: /^Bình luận về bài viết của/ });
    this.likeButtons = page.getByRole('button', { name: LIKE_LABEL });
    // "Nhớ mật khẩu" dialog: "Lúc khác" = "Not now"
    this.rememberPasswordLaterButton = page.getByRole('button', { name: 'Lúc khác' });
  }

  // Navigation
  async goto(): Promise<void> {
    await this.page.goto(HomePage.PATH, { waitUntil: 'domcontentloaded' });
    await expect(this.mainContent).toBeVisible({ timeout: 30_000 });
    await this.dismissRememberPasswordPrompt();
    await this.loadPosts(1);
  }

  /** Closes the "remember password" prompt if Facebook shows it. */
  async dismissRememberPasswordPrompt(): Promise<void> {
    if (await this.rememberPasswordLaterButton.isVisible()) {
      await this.rememberPasswordLaterButton.click();
    }
  }

  /**
   * Scrolls until at least `minCount` posts are loaded at the same time.
   * Facebook swaps posts that are far off screen for empty placeholders, so only a handful
   * of posts exist at once: keep minCount small (3 or so).
   */
  async loadPosts(minCount: number): Promise<void> {
    await this.page.mouse.move(640, 400);
    for (let attempt = 0; attempt < 20; attempt++) {
      if ((await this.commentButtons.count()) >= minCount) return;
      await this.page.mouse.wheel(0, 1500);
      await this.page.waitForTimeout(1_000);
    }
    expect(
      await this.commentButtons.count(),
      `expected at least ${minCount} loaded posts`,
    ).toBeGreaterThanOrEqual(minCount);
  }

  // Actions

  /**
   * Likes `count` random posts chosen from the first `pool` posts that can be liked.
   * Returns what is needed to unlike them afterwards.
   */
  async likeRandomPosts(count: number, pool = 8): Promise<LikedPost[]> {
    const liked: LikedPost[] = [];

    for (let k = 0; k < count; k++) {
      const available = Math.min(await this.likeButtons.count(), pool);
      if (available === 0) break;

      const button = this.likeButtons.nth(Math.floor(Math.random() * available));
      await button.scrollIntoViewIfNeeded();
      const label = (await button.getAttribute('aria-label')) ?? '';

      // Mark the button so it can be found again after its label changes
      const tag = `pw-liked-${k}`;
      await button.evaluate((el, value) => el.setAttribute('data-pw-liked', value), tag);
      const tagged = this.page.locator(`[data-pw-liked="${tag}"]`);

      await tagged.click();
      // Once liked, the label no longer says "Bày tỏ cảm xúc Thích ..."
      await expect(tagged).not.toHaveAttribute('aria-label', LIKE_LABEL);
      liked.push({ tag, label });
    }
    return liked;
  }

  /** Removes the likes made by likeRandomPosts(), to leave the account as it was. */
  async unlikePosts(liked: LikedPost[]): Promise<void> {
    for (const { tag, label } of liked) {
      const tagged = this.page.locator(`[data-pw-liked="${tag}"]`);
      if ((await tagged.count()) === 0) {
        throw new Error(`Could not find the liked post to unlike. Remove the like by hand: ${label}`);
      }
      await tagged.scrollIntoViewIfNeeded();
      await tagged.click();
      await expect(tagged).toHaveAttribute('aria-label', LIKE_LABEL);
    }
  }
}