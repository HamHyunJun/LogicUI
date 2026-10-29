import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/#/toast');
});

test('Toast: 알림이 오른쪽 아래 region에 쌓이고, 자동으로 사라지며, 호버 중에는 사라지지 않는다', async ({ page }) => {
  await page.getByRole('button', { name: '저장 알림' }).click();
  const toast = page.getByRole('status').filter({ hasText: '저장됨' });
  await expect(toast).toBeVisible();

  const box = (await toast.boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(box.x + box.width).toBeGreaterThan(viewport.width - 40); // 오른쪽
  expect(box.y + box.height).toBeGreaterThan(viewport.height - 60); // 아래

  await toast.hover();
  await page.waitForTimeout(4600); // 기본 4초를 넘겨도 호버 중에는 유지
  await expect(toast).toBeVisible();

  await page.mouse.move(5, 5);
  await expect(toast).toBeHidden({ timeout: 6000 });
});

test('Toast: foreground는 role="alert"이고, F8로 알림 영역에 포커스해 Tab·Esc로 다룰 수 있다', async ({ page }) => {
  await page.getByRole('button', { name: '오류 알림' }).click();
  const alert = page.getByRole('alert').filter({ hasText: '업로드 실패' });
  await expect(alert).toBeVisible();

  await page.getByRole('button', { name: '저장 알림' }).focus();
  await page.keyboard.press('F8');
  await expect(page.getByRole('region', { name: /알림/ })).toBeFocused();

  await alert.focus();
  await page.keyboard.press('Escape');
  await expect(alert).toBeHidden();
});

test('Toast: 실행 취소 버튼이 동작하고 알림을 닫는다', async ({ page }) => {
  await page.getByRole('button', { name: '저장 알림' }).click();
  const toast = page.getByRole('status').filter({ hasText: '저장됨' });
  await toast.getByRole('button', { name: '실행 취소' }).click();
  await expect(toast).toBeHidden();
  await expect(page.getByText('실행 취소 횟수: 1')).toBeVisible();
});
