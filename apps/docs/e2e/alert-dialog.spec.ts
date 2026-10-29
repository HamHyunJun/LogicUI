import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/#/alert-dialog');
});

test('AlertDialog: 열리면 취소에 포커스하고, 바깥 클릭으로는 닫히지 않으며, Esc로 닫고 포커스가 돌아온다', async ({ page }) => {
  const trigger = page.getByRole('button', { name: '프로젝트 삭제' });
  await trigger.click();
  const dialog = page.getByRole('alertdialog', { name: '프로젝트를 삭제할까요?' });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('button', { name: '취소' })).toBeFocused();

  await page.mouse.click(5, 5); // 오버레이
  await expect(dialog).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('AlertDialog: Tab이 다이얼로그 안에서 순환하고 삭제 버튼이 동작을 실행하고 닫는다', async ({ page }) => {
  await page.getByRole('button', { name: '프로젝트 삭제' }).click();
  const dialog = page.getByRole('alertdialog');
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role="alertdialog"]'))).toBe(true);
  }
  await dialog.getByRole('button', { name: '삭제', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('삭제 횟수: 1')).toBeVisible();
});
