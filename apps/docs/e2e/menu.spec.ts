import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/#/menu');
});

test('Menu: 키보드로 열고, 비활성 항목을 건너뛰며 이동하고, Enter로 선택하면 닫히고 포커스가 돌아온다', async ({ page }) => {
  const trigger = page.getByRole('button', { name: '파일' });
  await trigger.scrollIntoViewIfNeeded();
  await trigger.focus();
  await page.keyboard.press('ArrowDown');

  const menu = page.getByRole('menu', { name: '파일' });
  await expect(menu).toBeVisible();
  await expect(page.getByRole('menuitem', { name: '새 파일' })).toBeFocused();

  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: '열기' })).toBeFocused();
  await page.keyboard.press('ArrowDown'); // 비활성 '인쇄'를 건너뛴다
  await expect(page.getByRole('menuitem', { name: '저장', exact: true })).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.getByText('마지막 선택: 저장')).toBeVisible();
});

test('Menu: ArrowUp은 마지막 항목으로 열고, Home으로 처음으로 이동하고, Esc로 닫는다', async ({ page }) => {
  const trigger = page.getByRole('button', { name: '파일' });
  await trigger.scrollIntoViewIfNeeded();
  await trigger.focus();
  await page.keyboard.press('ArrowUp');
  await expect(page.getByRole('menuitem', { name: '다른 이름으로 저장' })).toBeFocused();

  await page.keyboard.press('Home');
  await expect(page.getByRole('menuitem', { name: '새 파일' })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('Menu: 체크박스·라디오 항목은 선택해도 메뉴가 열려 있고 상태가 바뀐다', async ({ page }) => {
  const trigger = page.getByRole('button', { name: '보기' });
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();

  const ruler = page.getByRole('menuitemcheckbox', { name: '눈금자' });
  await expect(ruler).toHaveAttribute('aria-checked', 'true');

  // 체크 표시가 글자를 가리지 않도록 왼쪽 여백(pl-9 = 36px)이 남아 있어야 한다.
  expect(await ruler.evaluate((el) => parseFloat(getComputedStyle(el).paddingLeft))).toBeGreaterThanOrEqual(36);
  await ruler.click();
  await expect(ruler).toHaveAttribute('aria-checked', 'false');

  const date = page.getByRole('menuitemradio', { name: '날짜순' });
  await date.click();
  await expect(date).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('menuitemradio', { name: '이름순' })).toHaveAttribute('aria-checked', 'false');
  await expect(page.getByRole('menu')).toBeVisible();
});

test('Menu: 바깥을 클릭하면 닫히고, 트리거 아래에 겹치지 않게 배치된다', async ({ page }) => {
  const trigger = page.getByRole('button', { name: '파일' });
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  const menu = page.getByRole('menu', { name: '파일' });
  await expect(menu).toBeVisible();
  await expect.poll(() => menu.evaluate((el) => getComputedStyle(el).scale)).toBe('none'); // 진입 애니메이션 종료

  const a = (await trigger.boundingBox())!;
  const c = (await menu.boundingBox())!;
  await expect(menu).toHaveAttribute('data-side', 'bottom');
  expect(c.y - (a.y + a.height)).toBeGreaterThanOrEqual(-0.5);
  expect(c.x).toBeCloseTo(a.x, 0); // align=start

  await page.mouse.click(5, 5);
  await expect(menu).toBeHidden();
});
