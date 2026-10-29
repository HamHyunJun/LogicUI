import { expect, test } from '@playwright/test';

test('Breadcrumb: Tab은 링크만 지나가고, 현재 페이지는 aria-current이며, 링크는 해당 페이지로 이동한다', async ({ page }) => {
  await page.goto('/#/breadcrumb');
  const nav = page.getByRole('navigation', { name: '현재 위치' });
  const current = nav.getByRole('link', { name: 'Breadcrumb' });
  await expect(current).toHaveAttribute('aria-current', 'page');

  const home = nav.getByRole('link', { name: '소개' });
  const menu = nav.getByRole('link', { name: 'Menu' });
  await home.focus();
  await page.keyboard.press('Tab');
  await expect(menu).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(current).not.toBeFocused(); // 현재 페이지는 탭 순서에서 제외

  await menu.click();
  await expect(page).toHaveURL(/#\/menu$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Menu' })).toBeVisible();
});
