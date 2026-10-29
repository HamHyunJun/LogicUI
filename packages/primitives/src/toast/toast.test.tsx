import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { configureAxe } from 'vitest-axe';
import { Toast, type ToastProviderProps, type ToastRootProps } from './index';

const axe = configureAxe({ rules: { 'color-contrast': { enabled: false } } });

function TestToast({ provider, ...root }: ToastRootProps & { provider?: ToastProviderProps }) {
  return (
    <Toast.Provider {...provider}>
      <button>바깥</button>
      <Toast.Root {...root}>
        <Toast.Title>저장됨</Toast.Title>
        <Toast.Description>변경 사항이 저장되었습니다.</Toast.Description>
        <Toast.Action>실행 취소</Toast.Action>
        <Toast.Close aria-label="닫기">×</Toast.Close>
      </Toast.Root>
      <Toast.Viewport />
    </Toast.Provider>
  );
}

const toast = () => screen.getByRole('status');
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

afterEach(() => {
  vi.useRealTimers();
});

describe('Toast', () => {
  describe('구조와 ARIA', () => {
    it('Viewport는 이름이 있는 region이고 Toast는 그 안에 렌더된다', () => {
      render(<TestToast />);
      const viewport = screen.getByRole('region', { name: /알림/ });
      expect(viewport).toContainElement(toast());
    });

    it('기본(background)은 role="status"와 aria-live="polite"다', () => {
      render(<TestToast />);
      expect(toast()).toHaveAttribute('aria-live', 'polite');
      expect(toast()).toHaveAttribute('aria-atomic', 'true');
      expect(toast()).toHaveAttribute('data-state', 'open');
    });

    it('foreground는 role="alert"와 aria-live="assertive"다', () => {
      render(<TestToast type="foreground" />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
      expect(alert).toHaveAttribute('data-type', 'foreground');
    });

    it('닫혀 있으면 렌더하지 않고 forceMount면 data-state="closed"로 렌더한다', () => {
      const { rerender } = render(<TestToast open={false} />);
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      rerender(<TestToast open={false} forceMount />);
      expect(toast()).toHaveAttribute('data-state', 'closed');
    });

    it('Toast는 키보드로 포커스할 수 있다', () => {
      render(<TestToast />);
      expect(toast()).toHaveAttribute('tabindex', '0');
    });
  });

  describe('키보드', () => {
    it('F8을 누르면 Viewport로 포커스가 옮겨진다', async () => {
      const user = userEvent.setup();
      render(<TestToast />);
      await user.keyboard('{F8}');
      expect(screen.getByRole('region')).toHaveFocus();
    });

    it('hotkey를 바꿀 수 있다', async () => {
      const user = userEvent.setup();
      render(
        <Toast.Provider>
          <Toast.Viewport hotkey="F6" />
        </Toast.Provider>,
      );
      await user.keyboard('{F8}');
      expect(screen.getByRole('region')).not.toHaveFocus();
      await user.keyboard('{F6}');
      expect(screen.getByRole('region')).toHaveFocus();
    });

    it('토스트에 포커스가 있을 때 Esc로 닫힌다', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<TestToast onOpenChange={onOpenChange} />);
      toast().focus();
      await user.keyboard('{Escape}');
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('Tab으로 토스트 안의 Action과 Close를 지나간다', async () => {
      const user = userEvent.setup();
      render(<TestToast />);
      toast().focus();
      await user.tab();
      expect(screen.getByRole('button', { name: '실행 취소' })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole('button', { name: '닫기' })).toHaveFocus();
    });
  });

  describe('버튼', () => {
    it('Close를 누르면 닫힌다', async () => {
      const user = userEvent.setup();
      render(<TestToast />);
      await user.click(screen.getByRole('button', { name: '닫기' }));
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('Action은 onClick을 호출하고 닫는다', async () => {
      const user = userEvent.setup();
      const onUndo = vi.fn();
      render(
        <Toast.Provider>
          <Toast.Root>
            <Toast.Action onClick={onUndo}>실행 취소</Toast.Action>
          </Toast.Root>
          <Toast.Viewport />
        </Toast.Provider>,
      );
      await user.click(screen.getByRole('button', { name: '실행 취소' }));
      expect(onUndo).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('onClick에서 preventDefault()하면 닫히지 않는다', async () => {
      const user = userEvent.setup();
      render(
        <Toast.Provider>
          <Toast.Root>
            <Toast.Close aria-label="닫기" onClick={(e) => e.preventDefault()} />
          </Toast.Root>
          <Toast.Viewport />
        </Toast.Provider>,
      );
      await user.click(screen.getByRole('button', { name: '닫기' }));
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('자동 닫힘', () => {
    it('기본 5초 뒤에 닫힌다', () => {
      vi.useFakeTimers();
      const onOpenChange = vi.fn();
      render(<TestToast onOpenChange={onOpenChange} />);
      advance(4999);
      expect(onOpenChange).not.toHaveBeenCalled();
      advance(1);
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('Provider duration과 토스트별 duration을 쓴다 (토스트 값이 우선)', () => {
      vi.useFakeTimers();
      const onOpenChange = vi.fn();
      render(<TestToast provider={{ duration: 1000 }} duration={3000} onOpenChange={onOpenChange} />);
      advance(2999);
      expect(onOpenChange).not.toHaveBeenCalled();
      advance(1);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('duration이 Infinity면 자동으로 닫히지 않는다', () => {
      vi.useFakeTimers();
      render(<TestToast duration={Infinity} />);
      advance(60_000);
      expect(toast()).toBeInTheDocument();
    });

    it('포인터를 올리면 멈추고 벗어나면 남은 시간부터 이어서 센다', () => {
      vi.useFakeTimers();
      const onOpenChange = vi.fn();
      render(<TestToast duration={1000} onOpenChange={onOpenChange} />);
      advance(600);
      fireEvent.pointerEnter(toast());
      advance(10_000); // 올려 둔 동안은 닫히지 않는다
      expect(onOpenChange).not.toHaveBeenCalled();
      fireEvent.pointerLeave(toast());
      advance(399);
      expect(onOpenChange).not.toHaveBeenCalled();
      advance(1); // 남은 400ms가 지남
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('포커스가 안에 있는 동안 멈추고 밖으로 나가면 이어서 센다', () => {
      vi.useFakeTimers();
      const onOpenChange = vi.fn();
      render(<TestToast duration={1000} onOpenChange={onOpenChange} />);
      fireEvent.focus(screen.getByRole('button', { name: '닫기' }));
      advance(5000);
      expect(onOpenChange).not.toHaveBeenCalled();
      fireEvent.blur(screen.getByRole('button', { name: '닫기' }), { relatedTarget: document.body });
      advance(1000);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('토스트 안에서 포커스가 옮겨 가는 동안에는 계속 멈춰 있다', () => {
      vi.useFakeTimers();
      const onOpenChange = vi.fn();
      render(<TestToast duration={1000} onOpenChange={onOpenChange} />);
      const action = screen.getByRole('button', { name: '실행 취소' });
      fireEvent.focus(action);
      fireEvent.blur(action, { relatedTarget: screen.getByRole('button', { name: '닫기' }) });
      advance(5000);
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('언마운트하면 타이머를 정리한다', () => {
      vi.useFakeTimers();
      const onOpenChange = vi.fn();
      const { unmount } = render(<TestToast duration={1000} onOpenChange={onOpenChange} />);
      unmount();
      advance(5000);
      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });

  describe('제어·비제어', () => {
    it('defaultOpen={false}면 처음에는 닫혀 있다', () => {
      render(<TestToast defaultOpen={false} />);
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('제어 모드에서는 open prop을 따른다', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      const { rerender } = render(<TestToast open onOpenChange={onOpenChange} />);
      await user.click(screen.getByRole('button', { name: '닫기' }));
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(toast()).toBeInTheDocument();
      rerender(<TestToast open={false} onOpenChange={onOpenChange} />);
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('여러 토스트가 같은 Viewport에 순서대로 쌓인다', () => {
      render(
        <Toast.Provider>
          <Toast.Root>
            <Toast.Title>첫째</Toast.Title>
          </Toast.Root>
          <Toast.Root>
            <Toast.Title>둘째</Toast.Title>
          </Toast.Root>
          <Toast.Viewport />
        </Toast.Provider>,
      );
      const items = screen.getAllByRole('status');
      expect(items).toHaveLength(2);
      expect(items[0]).toHaveTextContent('첫째');
      expect(items[1]).toHaveTextContent('둘째');
    });
  });

  describe('에러', () => {
    it('Provider 밖에서 Viewport·Root를 쓰면 에러를 던진다', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<Toast.Viewport />)).toThrow('<Toast.Viewport>은(는) <Toast.Provider> 안에서만 사용할 수 있습니다.');
      expect(() => render(<Toast.Root />)).toThrow('<Toast.Root>은(는) <Toast.Provider> 안에서만 사용할 수 있습니다.');
      spy.mockRestore();
    });

    it('Root 밖에서 Close를 쓰면 에러를 던진다', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<Toast.Close />)).toThrow('<Toast.Close>은(는) <Toast.Root> 안에서만 사용할 수 있습니다.');
      spy.mockRestore();
    });
  });

  describe('접근성 (axe)', () => {
    it('background와 foreground 모두 위반이 없다', async () => {
      const { container, rerender } = render(<TestToast />);
      expect(await axe(container)).toHaveNoViolations();
      rerender(<TestToast type="foreground" />);
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
