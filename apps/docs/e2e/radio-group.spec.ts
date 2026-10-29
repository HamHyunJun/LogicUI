import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/#/radio-group');
});

test('RadioGroup: Tab은 선택된 항목 하나에만 멈추고 방향키가 선택을 옮기며 비활성은 건너뛴다', async ({ page }) => {
  const free = page.getByRole('radio', { name: /^무료/ });
  const pro = page.getByRole('radio', { name: /^프로/ });
  await expect(pro).toHaveAttribute('aria-checked', 'true');

  await pro.focus();
  await page.keyboard.press('ArrowUp');
  await expect(free).toBeFocused();
  await expect(free).toHaveAttribute('aria-checked', 'true');

  await page.keyboard.press('ArrowDown');
  await expect(pro).toBeFocused();
  await page.keyboard.press('ArrowDown'); // 팀은 비활성이라 건너뛰고 무료로 순환
  await expect(free).toBeFocused();
  await expect(page.getByText('선택: free')).toBeVisible();
});

test('RadioGroup: 한 그룹 안의 라디오는 탭 정지점이 하나이고, label 클릭으로도 선택된다', async ({ page }) => {
  const tabbable = await page.getByRole('radiogroup', { name: '요금제' }).getByRole('radio').evaluateAll((els) => els.filter((el) => (el as HTMLElement).tabIndex === 0).length);
  expect(tabbable).toBe(1);

  await page.getByText('개인 프로젝트에 적합합니다.').click();
  await expect(page.getByRole('radio', { name: /^무료/ })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('radio', { name: /^무료/ }).locator('span')).toBeVisible(); // 선택 점 표시
});
