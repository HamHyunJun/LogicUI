import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/#/checkbox');
});

test('Checkbox: 자식 일부만 체크하면 "모두 선택"이 중간 상태가 되고 누르면 전체가 체크된다', async ({ page }) => {
  const all = page.getByRole('checkbox', { name: '모두 선택' });
  const email = page.getByRole('checkbox', { name: '이메일 알림' });
  const push = page.getByRole('checkbox', { name: '푸시 알림' });

  await expect(email).toHaveAttribute('aria-checked', 'true');
  await expect(all).toHaveAttribute('aria-checked', 'mixed');

  await all.click();
  await expect(all).toHaveAttribute('aria-checked', 'true');
  await expect(push).toHaveAttribute('aria-checked', 'true');

  await all.click();
  await expect(all).toHaveAttribute('aria-checked', 'false');
  await expect(email).toHaveAttribute('aria-checked', 'false');
});

test('Checkbox: Space로 전환하고 Enter로는 전환하지 않으며, label 클릭으로도 전환된다', async ({ page }) => {
  const push = page.getByRole('checkbox', { name: '푸시 알림' });
  await push.focus();
  await page.keyboard.press('Enter');
  await expect(push).toHaveAttribute('aria-checked', 'false');
  await page.keyboard.press('Space');
  await expect(push).toHaveAttribute('aria-checked', 'true');
  await page.getByText('푸시 알림', { exact: true }).click();
  await expect(push).toHaveAttribute('aria-checked', 'false');
});

test('Checkbox: 체크 아이콘이 보이고 비활성 체크박스는 전환되지 않는다', async ({ page }) => {
  const email = page.getByRole('checkbox', { name: '이메일 알림' });
  await expect(email.locator('svg').first()).toBeVisible();
  const locked = page.getByRole('checkbox', { name: '필수 약관 (비활성)' });
  await locked.click({ force: true });
  await expect(locked).toHaveAttribute('aria-checked', 'true');
});
