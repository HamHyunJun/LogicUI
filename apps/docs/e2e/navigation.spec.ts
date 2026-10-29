import { expect, test } from '@playwright/test';

test('소개 페이지가 열리고 컴포넌트 목록이 내비게이션에 있다', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'LogicUI' })).toBeVisible();
  await expect(page).toHaveTitle('LogicUI 문서');

  const nav = page.getByRole('navigation', { name: '컴포넌트' });
  await expect(nav.getByRole('link', { name: '소개' })).toHaveAttribute('aria-current', 'page');
  for (const name of ['Dialog', 'Tabs', 'Accordion', 'Popover', 'Tooltip', 'Menu']) {
    await expect(nav.getByRole('link', { name })).toBeVisible();
  }
});

test('링크로 이동하면 제목·aria-current가 바뀌고 h1으로 포커스가 이동한다', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: '컴포넌트' });
  await nav.getByRole('link', { name: 'Menu' }).click();

  await expect(page).toHaveURL(/#\/menu$/);
  await expect(page).toHaveTitle('Menu · LogicUI');
  await expect(page.getByRole('heading', { level: 1, name: 'Menu' })).toBeFocused();
  await expect(nav.getByRole('link', { name: 'Menu' })).toHaveAttribute('aria-current', 'page');
  await expect(nav.getByRole('link', { name: '소개' })).not.toHaveAttribute('aria-current', 'page');
});

test('직접 주소로 들어가도 해당 컴포넌트 페이지가 열리고 첫 로드는 포커스를 가져가지 않는다', async ({ page }) => {
  await page.goto('/#/tabs');
  await expect(page.getByRole('heading', { level: 1, name: 'Tabs' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Tabs' })).not.toBeFocused();
});

test('브라우저 뒤로 가기로 이전 페이지로 돌아온다', async ({ page }) => {
  await page.goto('/#/dialog');
  await page.getByRole('navigation', { name: '컴포넌트' }).getByRole('link', { name: 'Tooltip' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Tooltip' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'Dialog' })).toBeVisible();
  await expect(page).toHaveTitle('Dialog · LogicUI');
});

test('알 수 없는 주소는 소개 페이지로 대체된다', async ({ page }) => {
  await page.goto('/#/없는-페이지');
  await expect(page.getByRole('heading', { level: 1, name: 'LogicUI' })).toBeVisible();
});

test('모든 컴포넌트 페이지에 예제·사용법·API·키보드 섹션이 있다', async ({ page }) => {
  for (const slug of ['dialog', 'tabs', 'accordion', 'popover', 'tooltip', 'menu']) {
    await page.goto(`/#/${slug}`);
    for (const name of ['예제', '사용법', 'API', '키보드']) {
      await expect(page.getByRole('heading', { level: 2, name, exact: true }), `${slug} · ${name}`).toBeVisible();
    }
  }
});

test('본문 건너뛰기 버튼이 본문으로 포커스를 옮긴다', async ({ page }) => {
  await page.goto('/#/dialog');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('button', { name: '본문으로 건너뛰기' });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});
