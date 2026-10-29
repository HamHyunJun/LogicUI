import { expect, test } from '@playwright/test';

test('Progress: 값 버튼에 따라 aria-valuenow와 막대 너비가 바뀌고, 알 수 없는 상태는 aria-valuenow가 없다', async ({ page }) => {
  await page.goto('/#/progress');
  const bar = page.getByRole('progressbar', { name: '업로드' });
  const indicator = bar.locator('div');
  await expect(bar).toHaveAttribute('aria-valuenow', '35');

  const width = async () => ((await indicator.boundingBox())!.x + (await indicator.boundingBox())!.width) - (await bar.boundingBox())!.x;
  const total = (await bar.boundingBox())!.width;
  await expect.poll(width).toBeCloseTo(total * 0.35, -1); // 35% (±5px)

  await page.getByRole('button', { name: '+15' }).click();
  await expect(bar).toHaveAttribute('aria-valuenow', '50');
  await expect.poll(width).toBeCloseTo(total * 0.5, -1);

  const unknown = page.getByRole('progressbar', { name: /불러오는 중/ });
  await expect(unknown).not.toHaveAttribute('aria-valuenow');
  await expect(unknown).toHaveAttribute('data-state', 'indeterminate');
});
