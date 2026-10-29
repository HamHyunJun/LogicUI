import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { configureAxe } from 'vitest-axe';
import { Progress, type ProgressRootProps } from './index';

const axe = configureAxe({ rules: { 'color-contrast': { enabled: false } } });

function TestProgress(props: ProgressRootProps) {
  return (
    <Progress.Root aria-label="업로드" {...props}>
      <Progress.Indicator data-testid="indicator" />
    </Progress.Root>
  );
}

const bar = () => screen.getByRole('progressbar', { name: '업로드' });

describe('Progress', () => {
  describe('ARIA', () => {
    it('progressbar 역할과 aria-valuemin/max/now를 가진다', () => {
      render(<TestProgress value={30} />);
      expect(bar()).toHaveAttribute('aria-valuemin', '0');
      expect(bar()).toHaveAttribute('aria-valuemax', '100');
      expect(bar()).toHaveAttribute('aria-valuenow', '30');
    });

    it('max를 지정할 수 있다', () => {
      render(<TestProgress value={3} max={10} />);
      expect(bar()).toHaveAttribute('aria-valuemax', '10');
      expect(bar()).toHaveAttribute('aria-valuenow', '3');
    });

    it('value가 없거나 null이면 aria-valuenow 없이 indeterminate다', () => {
      const { rerender } = render(<TestProgress />);
      expect(bar()).not.toHaveAttribute('aria-valuenow');
      expect(bar()).toHaveAttribute('data-state', 'indeterminate');
      rerender(<TestProgress value={null} />);
      expect(bar()).toHaveAttribute('data-state', 'indeterminate');
    });

    it.each([-1, 101, Number.NaN])('범위를 벗어난 값(%s)은 indeterminate로 다룬다', (value) => {
      render(<TestProgress value={value} />);
      expect(bar()).not.toHaveAttribute('aria-valuenow');
      expect(bar()).toHaveAttribute('data-state', 'indeterminate');
    });

    it('data-state가 loading → complete로 바뀐다', () => {
      const { rerender } = render(<TestProgress value={50} />);
      expect(bar()).toHaveAttribute('data-state', 'loading');
      rerender(<TestProgress value={100} />);
      expect(bar()).toHaveAttribute('data-state', 'complete');
    });

    it('0은 유효한 값이다', () => {
      render(<TestProgress value={0} />);
      expect(bar()).toHaveAttribute('aria-valuenow', '0');
      expect(bar()).toHaveAttribute('data-state', 'loading');
    });

    it('getValueLabel로 aria-valuetext를 줄 수 있다', () => {
      render(<TestProgress value={3} max={5} getValueLabel={(v, m) => `${m}단계 중 ${v}단계`} />);
      expect(bar()).toHaveAttribute('aria-valuetext', '5단계 중 3단계');
    });

    it('Indicator는 data-value·data-max·data-state를 노출한다', () => {
      render(<TestProgress value={40} max={80} />);
      const indicator = screen.getByTestId('indicator');
      expect(indicator).toHaveAttribute('data-value', '40');
      expect(indicator).toHaveAttribute('data-max', '80');
      expect(indicator).toHaveAttribute('data-state', 'loading');
    });
  });

  describe('asChild와 에러', () => {
    it('asChild는 자식 엘리먼트에 역할을 위임한다', () => {
      render(
        <Progress.Root asChild value={10} aria-label="x">
          <section />
        </Progress.Root>,
      );
      expect(screen.getByRole('progressbar').tagName).toBe('SECTION');
    });

    it('Root 밖에서 Indicator를 쓰면 에러를 던진다', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<Progress.Indicator />)).toThrow('<Progress.Indicator>은(는) <Progress.Root> 안에서만 사용할 수 있습니다.');
      spy.mockRestore();
    });
  });

  describe('접근성 (axe)', () => {
    it.each([['진행 중', 40], ['완료', 100], ['알 수 없음', null]] as const)('%s 상태에 위반이 없다', async (_, value) => {
      const { container } = render(<TestProgress value={value} />);
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
