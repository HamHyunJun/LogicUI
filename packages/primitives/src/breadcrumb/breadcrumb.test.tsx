import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { configureAxe } from 'vitest-axe';
import { Breadcrumb } from './index';

const axe = configureAxe({ rules: { 'color-contrast': { enabled: false } } });

function TestBreadcrumb() {
  return (
    <Breadcrumb.Root aria-label="경로">
      <Breadcrumb.List>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="/">홈</Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Separator data-testid="sep" />
        <Breadcrumb.Item>
          <Breadcrumb.Link href="/docs">문서</Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Separator />
        <Breadcrumb.Item>
          <Breadcrumb.Page>메뉴</Breadcrumb.Page>
        </Breadcrumb.Item>
      </Breadcrumb.List>
    </Breadcrumb.Root>
  );
}

describe('Breadcrumb', () => {
  describe('구조와 ARIA', () => {
    it('nav landmark 안에 ol 목록이 있다', () => {
      render(<TestBreadcrumb />);
      const nav = screen.getByRole('navigation', { name: '경로' });
      expect(within(nav).getByRole('list')).toBeInTheDocument();
      expect(within(nav).getByRole('list').tagName).toBe('OL');
    });

    it('aria-label을 주지 않으면 기본 이름은 Breadcrumb이다', () => {
      render(
        <Breadcrumb.Root>
          <Breadcrumb.List />
        </Breadcrumb.Root>,
      );
      expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    });

    it('상위 경로는 href를 가진 링크다', () => {
      render(<TestBreadcrumb />);
      expect(screen.getByRole('link', { name: '홈' })).toHaveAttribute('href', '/');
      expect(screen.getByRole('link', { name: '문서' })).toHaveAttribute('href', '/docs');
    });

    it('현재 페이지는 aria-current="page"이고 비활성 링크로 노출된다', () => {
      render(<TestBreadcrumb />);
      const page = screen.getByRole('link', { name: '메뉴' });
      expect(page).toHaveAttribute('aria-current', 'page');
      expect(page).toHaveAttribute('aria-disabled', 'true');
      expect(page).not.toHaveAttribute('href');
    });

    it('구분자는 보조기기에서 숨겨지고 기본 내용은 "/"다', () => {
      render(<TestBreadcrumb />);
      const sep = screen.getByTestId('sep');
      expect(sep).toHaveAttribute('aria-hidden', 'true');
      expect(sep).toHaveAttribute('role', 'presentation');
      expect(sep).toHaveTextContent('/');
    });

    it('구분자 내용을 바꿀 수 있다', () => {
      render(
        <Breadcrumb.Root>
          <Breadcrumb.List>
            <Breadcrumb.Separator data-testid="sep">›</Breadcrumb.Separator>
          </Breadcrumb.List>
        </Breadcrumb.Root>,
      );
      expect(screen.getByTestId('sep')).toHaveTextContent('›');
    });
  });

  describe('키보드', () => {
    it('Tab은 링크만 순서대로 지나가고 현재 페이지와 구분자는 건너뛴다', async () => {
      const user = userEvent.setup();
      render(<TestBreadcrumb />);
      await user.tab();
      expect(screen.getByRole('link', { name: '홈' })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole('link', { name: '문서' })).toHaveFocus();
      await user.tab();
      expect(document.body).toHaveFocus();
    });
  });

  describe('asChild', () => {
    it('Link asChild는 자식 엘리먼트(라우터 링크 등)에 속성을 위임한다', () => {
      render(
        <Breadcrumb.Root>
          <Breadcrumb.List>
            <Breadcrumb.Item>
              <Breadcrumb.Link asChild>
                <button type="button">홈으로</button>
              </Breadcrumb.Link>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb.Root>,
      );
      expect(screen.getByRole('button', { name: '홈으로' })).toBeInTheDocument();
    });
  });

  describe('접근성 (axe)', () => {
    it('위반이 없다', async () => {
      const { container } = render(<TestBreadcrumb />);
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
