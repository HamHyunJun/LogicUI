import { expect, test } from '@playwright/test';

test('Tabs: 방향키는 비활성 탭을 건너뛰고 Home은 첫 탭으로 이동한다', async ({ page }) => {
  await page.goto('/#/tabs');
  const profile = page.getByRole('tab', { name: '프로필' });
  const security = page.getByRole('tab', { name: '보안' });
  await profile.click();

  await page.keyboard.press('ArrowRight');
  await expect(security).toHaveAttribute('aria-selected', 'true');
  await expect(security).toBeFocused();

  await page.keyboard.press('Home');
  await expect(profile).toHaveAttribute('aria-selected', 'true');
});

test('Accordion: 클릭으로 aria-expanded가 토글되고 ArrowDown은 다음 트리거로 이동한다', async ({ page }) => {
  await page.goto('/#/accordion');
  const first = page.getByRole('button', { name: '헤드리스 UI란?' });
  await first.click();
  const expanded = await first.getAttribute('aria-expanded');
  await first.click();
  await expect(first).not.toHaveAttribute('aria-expanded', expanded ?? '');

  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('button', { name: '접근성은 어떻게 보장하나요?' })).toBeFocused();
});
