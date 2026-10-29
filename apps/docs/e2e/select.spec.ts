import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/#/select');
});

test('Select: 키보드로 열고 이동해 Enter로 선택하면 라벨이 보이고 포커스는 트리거에 남는다', async ({ page }) => {
  const trigger = page.getByRole('combobox', { name: '과일' });
  await expect(trigger).toContainText('선택하세요');

  await trigger.focus();
  await page.keyboard.press('ArrowDown');
  const listbox = page.getByRole('listbox', { name: '과일' });
  await expect(listbox).toBeVisible();
  await expect(page.getByRole('option', { name: 'Apple' })).toHaveAttribute('data-highlighted', '');
  await expect(trigger).toBeFocused();

  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown'); // Blueberry(비활성)를 건너뛰고 Cherry
  await expect(page.getByRole('option', { name: 'Cherry' })).toHaveAttribute('data-highlighted', '');
  await page.keyboard.press('Enter');
  await expect(listbox).toBeHidden();
  await expect(trigger).toContainText('Cherry');
  await expect(trigger).toBeFocused();
  await expect(page.getByText('선택: cherry')).toBeVisible();
});

test('Select: 글자 입력으로 이동하고 클릭으로 선택하며 Esc·바깥 클릭으로 닫는다', async ({ page }) => {
  const trigger = page.getByRole('combobox', { name: '과일' });
  await trigger.focus();
  await page.keyboard.type('gr');
  await expect(page.getByRole('option', { name: 'Grape' })).toHaveAttribute('data-highlighted', '');

  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox')).toBeHidden();
  await expect(trigger).toContainText('선택하세요'); // Esc는 선택을 바꾸지 않는다

  await trigger.click();
  await page.getByRole('option', { name: 'Mango' }).click();
  await expect(trigger).toContainText('Mango');

  await trigger.click();
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(page.getByRole('listbox')).toBeHidden();
});

test('Select: 목록이 트리거 아래에 트리거 너비 이상으로 겹치지 않게 뜨고, 비활성 Select는 열리지 않는다', async ({ page }) => {
  const trigger = page.getByRole('combobox', { name: '과일' });
  await trigger.click();
  const listbox = page.getByRole('listbox', { name: '과일' });
  await expect.poll(() => listbox.evaluate((el) => getComputedStyle(el).scale)).toBe('none');
  const a = (await trigger.boundingBox())!;
  const c = (await listbox.boundingBox())!;
  await expect(listbox).toHaveAttribute('data-side', 'bottom');
  expect(c.y - (a.y + a.height)).toBeGreaterThanOrEqual(-0.5);
  expect(c.width).toBeGreaterThanOrEqual(a.width - 1);
  await page.keyboard.press('Escape');

  const locked = page.getByRole('combobox', { name: '비활성' });
  await expect(locked).toBeDisabled();
});

test('Select: Dialog 안에서 Esc는 목록만 먼저 닫고 한 번 더 누르면 Dialog가 닫힌다', async ({ page }) => {
  await page.getByRole('button', { name: '설정 열기' }).click();
  const dialog = page.getByRole('dialog', { name: '정렬 설정' });
  const trigger = dialog.getByRole('combobox', { name: '정렬 기준' });
  await trigger.click();
  const listbox = page.getByRole('listbox', { name: '정렬 기준' });
  await expect(listbox).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(listbox).toBeHidden();
  await expect(dialog).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('Select: Dialog 안에서 옵션을 클릭하면 선택되고 Dialog는 열려 있다', async ({ page }) => {
  await page.getByRole('button', { name: '설정 열기' }).click();
  const dialog = page.getByRole('dialog', { name: '정렬 설정' });
  const trigger = dialog.getByRole('combobox', { name: '정렬 기준' });
  await trigger.click();
  await page.getByRole('option', { name: '날짜순' }).click();
  await expect(trigger).toContainText('날짜순');
  await expect(dialog).toBeVisible();
});
