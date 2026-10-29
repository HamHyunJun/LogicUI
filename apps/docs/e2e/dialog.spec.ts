import { expect, test, type Page } from '@playwright/test';

const focusInsideDialog = (page: Page): Promise<boolean> =>
  page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'));

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('열리면 포커스가 내부로 이동하고 Tab·Shift+Tab 포커스가 밖으로 나가지 않는다', async ({ page }) => {
  await page.getByRole('button', { name: '프로필 편집' }).first().click();
  await expect(page.getByRole('dialog', { name: '프로필 편집' })).toBeVisible();
  expect(await focusInsideDialog(page)).toBe(true);

  for (const key of ['Tab', 'Shift+Tab']) {
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press(key);
      expect(await focusInsideDialog(page)).toBe(true);
    }
  }
});

test('Esc와 바깥 클릭으로 닫히고 포커스가 trigger로 돌아온다', async ({ page }) => {
  const trigger = page.getByRole('button', { name: '프로필 편집' }).first();
  const dialog = page.getByRole('dialog', { name: '프로필 편집' });

  await trigger.click();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await page.mouse.click(5, 5);
  await expect(dialog).toBeHidden();
});

test('중첩 다이얼로그에서 Esc는 가장 위 레이어만 닫는다', async ({ page }) => {
  await page.getByRole('button', { name: '설정 열기' }).click();
  await page.getByRole('button', { name: '계정 삭제' }).click();
  const inner = page.getByRole('dialog', { name: '정말 삭제할까요?' });
  const outer = page.getByRole('dialog', { name: '설정' });
  await expect(inner).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(inner).toBeHidden();
  await expect(outer).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(outer).toBeHidden();
});
