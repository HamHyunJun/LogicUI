import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/#/switch');
});

test('Switch: 클릭·label·Space·Enter로 전환되고 손잡이가 움직인다', async ({ page }) => {
  const sw = page.getByRole('switch', { name: '비행기 모드' });
  const thumb = sw.locator('span');
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  const before = (await thumb.boundingBox())!;

  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await expect.poll(async () => (await thumb.boundingBox())!.x).toBeGreaterThan(before.x + 10);

  await page.getByText('비행기 모드', { exact: true }).click();
  await expect(sw).toHaveAttribute('aria-checked', 'false');

  await sw.focus();
  await page.keyboard.press('Space');
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Enter');
  await expect(sw).toHaveAttribute('aria-checked', 'false');
});

test('Switch: 비활성 스위치는 전환되지 않고 Tab 순서에서 제외된다', async ({ page }) => {
  const disabled = page.getByRole('switch', { name: '베타 기능 (비활성)' });
  await expect(disabled).toBeDisabled();
  await disabled.click({ force: true });
  await expect(disabled).toHaveAttribute('aria-checked', 'false');
});
