import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { configureAxe } from 'vitest-axe';
import { Switch, type SwitchRootProps } from './index';

const axe = configureAxe({ rules: { 'color-contrast': { enabled: false } } });

function TestSwitch(props: SwitchRootProps) {
  return (
    <Switch.Root aria-label="알림" {...props}>
      <Switch.Thumb data-testid="thumb" />
    </Switch.Root>
  );
}

const getSwitch = () => screen.getByRole('switch', { name: '알림' });

describe('Switch', () => {
  describe('ARIA', () => {
    it('role="switch"와 aria-checked를 가지고 기본은 꺼짐이다', () => {
      render(<TestSwitch />);
      expect(getSwitch()).toHaveAttribute('aria-checked', 'false');
      expect(getSwitch()).toHaveAttribute('data-state', 'unchecked');
      expect(screen.getByTestId('thumb')).toHaveAttribute('data-state', 'unchecked');
    });

    it('defaultChecked면 켜진 상태로 시작한다', () => {
      render(<TestSwitch defaultChecked />);
      expect(getSwitch()).toHaveAttribute('aria-checked', 'true');
      expect(getSwitch()).toHaveAttribute('data-state', 'checked');
    });

    it('disabled면 data-disabled가 붙고 전환되지 않는다', async () => {
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      render(<TestSwitch disabled onCheckedChange={onCheckedChange} />);
      expect(getSwitch()).toBeDisabled();
      expect(getSwitch()).toHaveAttribute('data-disabled');
      expect(screen.getByTestId('thumb')).toHaveAttribute('data-disabled');
      await user.click(getSwitch());
      expect(onCheckedChange).not.toHaveBeenCalled();
    });

    it('label로 이름을 붙일 수 있고 label 클릭으로 전환된다', async () => {
      const user = userEvent.setup();
      render(
        <>
          <label htmlFor="airplane">비행기 모드</label>
          <Switch.Root id="airplane">
            <Switch.Thumb />
          </Switch.Root>
        </>,
      );
      await user.click(screen.getByText('비행기 모드'));
      expect(screen.getByRole('switch', { name: '비행기 모드' })).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('키보드', () => {
    it('Space로 전환한다', async () => {
      const user = userEvent.setup();
      render(<TestSwitch />);
      getSwitch().focus();
      await user.keyboard(' ');
      expect(getSwitch()).toHaveAttribute('aria-checked', 'true');
      await user.keyboard(' ');
      expect(getSwitch()).toHaveAttribute('aria-checked', 'false');
    });

    it('Enter로도 전환한다 (APG 선택 사항)', async () => {
      const user = userEvent.setup();
      render(<TestSwitch />);
      getSwitch().focus();
      await user.keyboard('{Enter}');
      expect(getSwitch()).toHaveAttribute('aria-checked', 'true');
    });

    it('Tab으로 포커스를 받는다', async () => {
      const user = userEvent.setup();
      render(<TestSwitch />);
      await user.tab();
      expect(getSwitch()).toHaveFocus();
    });
  });

  describe('제어·비제어', () => {
    it('클릭하면 전환되고 onCheckedChange를 호출한다', async () => {
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      render(<TestSwitch onCheckedChange={onCheckedChange} />);
      await user.click(getSwitch());
      expect(onCheckedChange).toHaveBeenLastCalledWith(true);
      expect(getSwitch()).toHaveAttribute('aria-checked', 'true');
      await user.click(getSwitch());
      expect(onCheckedChange).toHaveBeenLastCalledWith(false);
    });

    it('제어 모드에서는 checked prop을 따른다', async () => {
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      const { rerender } = render(<TestSwitch checked={false} onCheckedChange={onCheckedChange} />);
      await user.click(getSwitch());
      expect(onCheckedChange).toHaveBeenCalledWith(true);
      expect(getSwitch()).toHaveAttribute('aria-checked', 'false');
      rerender(<TestSwitch checked onCheckedChange={onCheckedChange} />);
      expect(getSwitch()).toHaveAttribute('aria-checked', 'true');
    });

    it('onClick에서 preventDefault()하면 전환되지 않는다', async () => {
      const user = userEvent.setup();
      render(<TestSwitch onClick={(e) => e.preventDefault()} />);
      await user.click(getSwitch());
      expect(getSwitch()).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('폼', () => {
    it('name이 있으면 켜졌을 때만 폼 값에 포함된다', async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <TestSwitch name="notify" value="yes" />
        </form>,
      );
      const form = screen.getByTestId('form') as HTMLFormElement;
      expect(new FormData(form).get('notify')).toBeNull();
      await user.click(getSwitch());
      expect(new FormData(form).get('notify')).toBe('yes');
    });

    it('name이 없으면 숨은 input을 렌더하지 않는다', () => {
      const { container } = render(<TestSwitch />);
      expect(container.querySelector('input')).toBeNull();
    });

    it('button type이 button이라 폼을 제출하지 않는다', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
      render(
        <form onSubmit={onSubmit}>
          <TestSwitch />
        </form>,
      );
      await user.click(getSwitch());
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('asChild와 에러', () => {
    it('asChild는 자식 엘리먼트에 역할과 상태를 위임한다', () => {
      render(
        <Switch.Root asChild defaultChecked aria-label="알림">
          <span tabIndex={0} />
        </Switch.Root>,
      );
      const el = screen.getByRole('switch', { name: '알림' });
      expect(el.tagName).toBe('SPAN');
      expect(el).toHaveAttribute('aria-checked', 'true');
    });

    it('Root 밖에서 Thumb을 쓰면 에러를 던진다', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<Switch.Thumb />)).toThrow('<Switch.Thumb>은(는) <Switch.Root> 안에서만 사용할 수 있습니다.');
      spy.mockRestore();
    });
  });

  describe('접근성 (axe)', () => {
    it('꺼진 상태에 위반이 없다', async () => {
      const { container } = render(<TestSwitch />);
      expect(await axe(container)).toHaveNoViolations();
    });

    it('켜진 상태에 위반이 없다', async () => {
      const { container } = render(<TestSwitch defaultChecked />);
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
