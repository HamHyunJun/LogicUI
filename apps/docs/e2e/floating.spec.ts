import { expect, test, type Locator, type Page } from '@playwright/test';

type Side = 'top' | 'right' | 'bottom' | 'left';

// 진입 애니메이션(scale)이 끝나야 박스가 실제 레이아웃 크기와 같다.
const settled = (content: Locator): Promise<void> =>
  expect.poll(() => content.evaluate((el) => getComputedStyle(el).transform)).toBe('none');

// 콘텐츠가 trigger 바깥쪽에 놓였고(겹침 0.5px 허용) 뷰포트 안에 있는지 검사한다.
const expectPlacedOutside = async (page: Page, trigger: Locator, content: Locator, side: Side): Promise<void> => {
  await settled(content);
  const a = (await trigger.boundingBox())!;
  const c = (await content.boundingBox())!;
  const gap = {
    top: a.y - (c.y + c.height),
    bottom: c.y - (a.y + a.height),
    left: a.x - (c.x + c.width),
    right: c.x - (a.x + a.width),
  }[side];
  expect(gap, `${side} 방향에서 trigger와의 간격`).toBeGreaterThanOrEqual(-0.5);

  const viewport = page.viewportSize()!;
  expect(c.x).toBeGreaterThanOrEqual(0);
  expect(c.y).toBeGreaterThanOrEqual(0);
  expect(c.x + c.width).toBeLessThanOrEqual(viewport.width);
  expect(c.y + c.height).toBeLessThanOrEqual(viewport.height);
};

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

for (const side of ['top', 'right', 'bottom', 'left'] as const) {
  test(`Tooltip ${side}: 호버로 열리고 trigger와 겹치지 않으며 Esc로 닫힌다`, async ({ page }) => {
    const trigger = page.getByRole('button', { name: side, exact: true }).first();
    await trigger.scrollIntoViewIfNeeded();
    await trigger.hover();
    const tooltip = page.getByRole('tooltip');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveAttribute('data-side', side);
    await expectPlacedOutside(page, trigger, tooltip, side);

    await page.keyboard.press('Escape');
    await expect(tooltip).toBeHidden();
  });

  test(`Popover ${side}: 클릭으로 열리고 trigger와 겹치지 않으며 Esc로 닫히고 포커스가 돌아온다`, async ({ page }) => {
    const trigger = page.getByRole('button', { name: '크기 설정' });
    await trigger.scrollIntoViewIfNeeded();
    await page.getByRole('radio', { name: side, exact: true }).check();
    await trigger.click();
    const popover = page.getByRole('dialog', { name: '크기 설정' });
    await expect(popover).toBeVisible();
    await expect(popover).toHaveAttribute('data-side', side);
    await expectPlacedOutside(page, trigger, popover, side);

    await page.keyboard.press('Escape');
    await expect(popover).toBeHidden();
    await expect(trigger).toBeFocused();

    // 다시 열어도 같은 위치여야 한다(두 번째 열기에서만 드러나던 겹침 회귀 방지).
    await trigger.click();
    await expect(popover).toBeVisible();
    await expectPlacedOutside(page, trigger, popover, side);
  });
}
