import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/#/toggle-group');
});

test('ToggleGroup: single은 하나만 켜지고 방향키는 포커스만 옮기며 Space로 켠다', async ({ page }) => {
  const left = page.getByRole('button', { name: '왼쪽' });
  const center = page.getByRole('button', { name: '가운데' });
  await expect(left).toHaveAttribute('aria-pressed', 'true');

  await left.focus();
  await page.keyboard.press('ArrowRight');
  await expect(center).toBeFocused();
  await expect(center).toHaveAttribute('aria-pressed', 'false'); // 방향키는 선택하지 않는다
  await page.keyboard.press('Space');
  await expect(center).toHaveAttribute('aria-pressed', 'true');
  await expect(left).toHaveAttribute('aria-pressed', 'false');
});

test('ToggleGroup: multiple은 여러 개를 켤 수 있고 비활성 항목은 건너뛰며 탭 정지점은 하나다', async ({ page }) => {
  const bold = page.getByRole('button', { name: '굵게' });
  const italic = page.getByRole('button', { name: '기울임' });
  await italic.click();
  await expect(bold).toHaveAttribute('aria-pressed', 'true');
  await expect(italic).toHaveAttribute('aria-pressed', 'true');

  await italic.focus();
  await page.keyboard.press('ArrowRight'); // 밑줄은 비활성이라 건너뛰고 처음으로 순환
  await expect(bold).toBeFocused();

  const stops = await page.getByRole('group', { name: '서식' }).getByRole('button').evaluateAll((els) => els.filter((el) => (el as HTMLElement).tabIndex === 0).length);
  expect(stops).toBe(1);
});
