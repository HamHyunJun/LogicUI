import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/#/combobox');
});

test('Combobox: 타이핑하면 거른 목록이 열리고 ↓·Enter로 선택하면 입력창이 라벨로 채워지고 포커스가 남는다', async ({ page }) => {
  const input = page.getByRole('combobox', { name: '나라' });
  await input.click();
  await page.keyboard.type('국');
  const listbox = page.getByRole('listbox');
  await expect(listbox).toBeVisible();
  await expect(page.getByRole('option')).toHaveText(['대한민국', '미국', '중국', '영국']);
  await expect(input).not.toHaveAttribute('aria-activedescendant'); // 타이핑만으로는 가리키지 않는다

  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('option', { name: '대한민국' })).toHaveAttribute('data-highlighted', '');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(listbox).toBeHidden();
  await expect(input).toHaveValue('미국');
  await expect(input).toBeFocused();
  await expect(page.getByText('선택: 미국')).toBeVisible();
});

test('Combobox: 일치하는 옵션이 없으면 안내가 보이고, Esc는 입력 텍스트를 그대로 두고 닫는다', async ({ page }) => {
  const input = page.getByRole('combobox', { name: '나라' });
  await input.click();
  await page.keyboard.type('zzz');
  await expect(page.getByRole('listbox').getByText('일치하는 나라가 없습니다.')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox')).toBeHidden();
  await expect(input).toHaveValue('zzz');
});

test('Combobox: 옵션 클릭으로 선택하고, 목록이 입력창 아래에 입력창 너비 이상으로 겹치지 않게 뜬다', async ({ page }) => {
  const input = page.getByRole('combobox', { name: '나라' });
  await input.click();
  await page.keyboard.type('미');
  const listbox = page.getByRole('listbox');
  await expect.poll(() => listbox.evaluate((el) => getComputedStyle(el).scale)).toBe('none');
  const a = (await input.boundingBox())!;
  const c = (await listbox.boundingBox())!;
  expect(c.y - (a.y + a.height)).toBeGreaterThanOrEqual(-0.5);
  expect(c.width).toBeGreaterThanOrEqual(a.width - 1);

  await page.getByRole('option', { name: '미국' }).click();
  await expect(input).toHaveValue('미국');
  await expect(input).toBeFocused();
});

test('Combobox: Tab은 선택 없이 닫고 포커스를 보내며, 바깥 클릭으로도 닫힌다', async ({ page }) => {
  const input = page.getByRole('combobox', { name: '나라' });
  await input.click();
  await page.keyboard.type('일');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('listbox')).toBeHidden();
  await expect(input).toHaveValue('일');
  await expect(page.getByText('선택: 없음')).toBeVisible();

  await input.click();
  await page.keyboard.type('독');
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(page.getByRole('listbox')).toBeHidden();
});
