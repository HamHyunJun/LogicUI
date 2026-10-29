import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/#/slider');
});

test('Slider: 방향키·PageUp/Down·Home/End로 값이 바뀌고 썸이 따라 움직인다', async ({ page }) => {
  const thumb = page.getByRole('slider', { name: '볼륨' });
  await expect(thumb).toHaveAttribute('aria-valuenow', '40');
  const x0 = (await thumb.boundingBox())!.x;

  await thumb.focus();
  await page.keyboard.press('ArrowRight');
  await expect(thumb).toHaveAttribute('aria-valuenow', '41');
  await page.keyboard.press('PageUp');
  await expect(thumb).toHaveAttribute('aria-valuenow', '51');
  await expect.poll(async () => (await thumb.boundingBox())!.x).toBeGreaterThan(x0);

  await page.keyboard.press('End');
  await expect(thumb).toHaveAttribute('aria-valuenow', '100');
  await page.keyboard.press('Home');
  await expect(thumb).toHaveAttribute('aria-valuenow', '0');
  await expect(page.getByText('확정 0')).toBeVisible();
});

test('Slider: 트랙을 클릭하면 그 위치로, 드래그하면 따라가고 놓을 때 확정된다', async ({ page }) => {
  const thumb = page.getByRole('slider', { name: '볼륨' });
  const root = thumb.locator('xpath=..');
  const box = (await root.boundingBox())!;
  const y = box.y + box.height / 2;

  await page.mouse.click(box.x + box.width * 0.8, y);
  await expect.poll(async () => Number(await thumb.getAttribute('aria-valuenow'))).toBeGreaterThanOrEqual(79);
  await expect(thumb).toBeFocused();

  await page.mouse.move(box.x + box.width * 0.8, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.25, y, { steps: 5 });
  await expect.poll(async () => Number(await thumb.getAttribute('aria-valuenow'))).toBeLessThanOrEqual(26);
  await page.mouse.up();
  const final = await thumb.getAttribute('aria-valuenow');
  await expect(page.getByText(`확정 ${final}`)).toBeVisible();
});

test('Slider: 수직 슬라이더는 step 단위로 움직이고 비활성 슬라이더는 포커스를 받지 않는다', async ({ page }) => {
  const vertical = page.getByRole('slider', { name: /밝기/ });
  await expect(vertical).toHaveAttribute('aria-orientation', 'vertical');
  await vertical.focus();
  await page.keyboard.press('ArrowUp');
  await expect(vertical).toHaveAttribute('aria-valuenow', '80'); // step 10

  const locked = page.getByRole('slider', { name: '비활성' });
  expect(await locked.evaluate((el) => (el as HTMLElement).tabIndex)).toBe(-1);
});
