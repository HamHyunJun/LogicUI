import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { configureAxe } from 'vitest-axe';
import { Checkbox, type CheckboxRootProps } from './index';

const axe = configureAxe({ rules: { 'color-contrast': { enabled: false } } });

function TestCheckbox(props: CheckboxRootProps) {
  return (
    <Checkbox.Root aria-label="약관 동의" {...props}>
      <Checkbox.Indicator data-testid="indicator" />
    </Checkbox.Root>
  );
}

const getBox = () => screen.getByRole('checkbox', { name: '약관 동의' });

describe('Checkbox', () => {
  describe('ARIA', () => {
    it('role="checkbox"와 aria-checked를 가지고 기본은 체크 해제다', () => {
      render(<TestCheckbox />);
      expect(getBox()).toHaveAttribute('aria-checked', 'false');
      expect(getBox()).toHaveAttribute('data-state', 'unchecked');
    });

    it('defaultChecked면 체크된 상태로 시작한다', () => {
      render(<TestCheckbox defaultChecked />);
      expect(getBox()).toHaveAttribute('aria-checked', 'true');
      expect(getBox()).toHaveAttribute('data-state', 'checked');
    });

    it('indeterminate는 aria-checked="mixed"다', () => {
      render(<TestCheckbox checked="indeterminate" />);
      expect(getBox()).toHaveAttribute('aria-checked', 'mixed');
      expect(getBox()).toHaveAttribute('data-state', 'indeterminate');
    });

    it('Indicator는 체크되거나 중간 상태일 때만 렌더된다', () => {
      const { rerender } = render(<TestCheckbox checked={false} />);
      expect(screen.queryByTestId('indicator')).not.toBeInTheDocument();
      rerender(<TestCheckbox checked />);
      expect(screen.getByTestId('indicator')).toHaveAttribute('data-state', 'checked');
      rerender(<TestCheckbox checked="indeterminate" />);
      expect(screen.getByTestId('indicator')).toHaveAttribute('data-state', 'indeterminate');
    });

    it('forceMount면 체크되지 않아도 Indicator를 렌더한다', () => {
      render(
        <Checkbox.Root aria-label="x">
          <Checkbox.Indicator forceMount data-testid="indicator" />
        </Checkbox.Root>,
      );
      expect(screen.getByTestId('indicator')).toHaveAttribute('data-state', 'unchecked');
    });

    it('disabled면 전환되지 않고 data-disabled가 붙는다', async () => {
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      render(<TestCheckbox disabled onCheckedChange={onCheckedChange} />);
      expect(getBox()).toBeDisabled();
      expect(getBox()).toHaveAttribute('data-disabled');
      await user.click(getBox());
      expect(onCheckedChange).not.toHaveBeenCalled();
    });

    it('label 클릭으로 전환된다', async () => {
      const user = userEvent.setup();
      render(
        <>
          <label htmlFor="terms">이용약관</label>
          <Checkbox.Root id="terms" />
        </>,
      );
      await user.click(screen.getByText('이용약관'));
      expect(screen.getByRole('checkbox', { name: '이용약관' })).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('키보드', () => {
    it('Space로 전환한다', async () => {
      const user = userEvent.setup();
      render(<TestCheckbox />);
      getBox().focus();
      await user.keyboard(' ');
      expect(getBox()).toHaveAttribute('aria-checked', 'true');
      await user.keyboard(' ');
      expect(getBox()).toHaveAttribute('aria-checked', 'false');
    });

    it('Enter로는 전환하지 않는다 (APG에 없음)', async () => {
      const user = userEvent.setup();
      render(<TestCheckbox />);
      getBox().focus();
      await user.keyboard('{Enter}');
      expect(getBox()).toHaveAttribute('aria-checked', 'false');
    });

    it('Tab으로 포커스를 받는다', async () => {
      const user = userEvent.setup();
      render(<TestCheckbox />);
      await user.tab();
      expect(getBox()).toHaveFocus();
    });
  });

  describe('제어·비제어', () => {
    it('클릭하면 전환되고 onCheckedChange를 호출한다', async () => {
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      render(<TestCheckbox onCheckedChange={onCheckedChange} />);
      await user.click(getBox());
      expect(onCheckedChange).toHaveBeenLastCalledWith(true);
      await user.click(getBox());
      expect(onCheckedChange).toHaveBeenLastCalledWith(false);
    });

    it('중간 상태에서 누르면 체크된다', async () => {
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      render(<TestCheckbox defaultChecked="indeterminate" onCheckedChange={onCheckedChange} />);
      await user.click(getBox());
      expect(onCheckedChange).toHaveBeenCalledWith(true);
      expect(getBox()).toHaveAttribute('aria-checked', 'true');
    });

    it('제어 모드에서는 checked prop을 따른다', async () => {
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      const { rerender } = render(<TestCheckbox checked={false} onCheckedChange={onCheckedChange} />);
      await user.click(getBox());
      expect(onCheckedChange).toHaveBeenCalledWith(true);
      expect(getBox()).toHaveAttribute('aria-checked', 'false');
      rerender(<TestCheckbox checked onCheckedChange={onCheckedChange} />);
      expect(getBox()).toHaveAttribute('aria-checked', 'true');
    });

    it('onClick에서 preventDefault()하면 전환되지 않는다', async () => {
      const user = userEvent.setup();
      render(<TestCheckbox onClick={(e) => e.preventDefault()} />);
      await user.click(getBox());
      expect(getBox()).toHaveAttribute('aria-checked', 'false');
    });

    it('부모-자식 구성: 자식이 일부만 체크되면 부모는 중간 상태가 될 수 있다', async () => {
      const user = userEvent.setup();
      function Group() {
        const [items, setItems] = React.useState([false, false]);
        const all = items.every(Boolean) ? true : items.some(Boolean) ? 'indeterminate' : false;
        return (
          <>
            <Checkbox.Root aria-label="전체" checked={all} onCheckedChange={(c) => setItems([c === true, c === true])} />
            {items.map((v, i) => (
              <Checkbox.Root key={i} aria-label={`항목 ${i}`} checked={v} onCheckedChange={(c) => setItems(items.map((x, j) => (j === i ? c === true : x)))} />
            ))}
          </>
        );
      }
      render(<Group />);
      await user.click(screen.getByRole('checkbox', { name: '항목 0' }));
      expect(screen.getByRole('checkbox', { name: '전체' })).toHaveAttribute('aria-checked', 'mixed');
      await user.click(screen.getByRole('checkbox', { name: '전체' }));
      expect(screen.getByRole('checkbox', { name: '항목 1' })).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('폼', () => {
    it('name이 있으면 체크됐을 때만 폼 값에 포함된다 (중간 상태는 제외)', async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <TestCheckbox name="terms" value="agree" />
        </form>,
      );
      const form = screen.getByTestId('form') as HTMLFormElement;
      expect(new FormData(form).get('terms')).toBeNull();
      await user.click(getBox());
      expect(new FormData(form).get('terms')).toBe('agree');
    });

    it('중간 상태는 폼 값에 포함되지 않는다', () => {
      render(
        <form data-testid="form">
          <TestCheckbox name="terms" checked="indeterminate" />
        </form>,
      );
      expect(new FormData(screen.getByTestId('form') as HTMLFormElement).get('terms')).toBeNull();
    });
  });

  describe('asChild와 에러', () => {
    it('Root 밖에서 Indicator를 쓰면 에러를 던진다', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<Checkbox.Indicator />)).toThrow('<Checkbox.Indicator>은(는) <Checkbox.Root> 안에서만 사용할 수 있습니다.');
      spy.mockRestore();
    });
  });

  describe('접근성 (axe)', () => {
    it.each([
      ['체크 해제', false],
      ['체크', true],
      ['중간', 'indeterminate'],
    ] as const)('%s 상태에 위반이 없다', async (_, checked) => {
      const { container } = render(<TestCheckbox checked={checked} />);
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
