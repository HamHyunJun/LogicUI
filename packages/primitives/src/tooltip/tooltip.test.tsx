import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { configureAxe } from 'vitest-axe';
import { Tooltip, type TooltipContentProps, type TooltipRootProps } from './index';

// region: 포털로 body에 붙는 툴팁은 랜드마크 밖에 놓이는데, 이는 테스트 문서 구조의 한계이지 컴포넌트의 문제가 아니다.
const axe = configureAxe({ rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } });

interface TestTooltipProps extends TooltipRootProps {
  contentProps?: TooltipContentProps;
}

function TestTooltip({ contentProps, ...rootProps }: TestTooltipProps) {
  return (
    <>
      <button>바깥</button>
      <Tooltip.Root delayDuration={0} closeDelay={0} {...rootProps}>
        <Tooltip.Trigger>저장</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content {...contentProps}>변경 사항을 저장합니다</Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </>
  );
}

const trigger = () => screen.getByRole('button', { name: '저장' });

afterEach(() => {
  vi.useRealTimers();
});

describe('Tooltip', () => {
  describe('ARIA', () => {
    it('열리면 role="tooltip"이 되고 Trigger가 aria-describedby로 가리킨다', async () => {
      const user = userEvent.setup();
      render(<TestTooltip />);
      expect(trigger()).not.toHaveAttribute('aria-describedby');

      await user.hover(trigger());
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveTextContent('변경 사항을 저장합니다');
      expect(trigger()).toHaveAttribute('aria-describedby', tooltip.id);
      expect(trigger()).toHaveAccessibleDescription('변경 사항을 저장합니다');
    });

    it('툴팁 자체는 포커스를 받지 않는다', async () => {
      const user = userEvent.setup();
      render(<TestTooltip />);
      await user.hover(trigger());
      expect(screen.getByRole('tooltip')).not.toHaveAttribute('tabindex');
    });

    it('data-state / data-side를 노출하고 fixed로 배치한다', async () => {
      const user = userEvent.setup();
      render(<TestTooltip contentProps={{ side: 'right' }} />);
      await user.hover(trigger());
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveAttribute('data-state', 'open');
      expect(tooltip.style.position).toBe('fixed');
      expect(tooltip.dataset.side).toBeDefined();
      expect(trigger()).toHaveAttribute('data-state', 'open');
    });

    it('Root 밖에서 쓰면 에러를 던진다', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<Tooltip.Trigger>x</Tooltip.Trigger>)).toThrow('<Tooltip.Trigger>은(는) <Tooltip.Root> 안에서만 사용할 수 있습니다.');
      spy.mockRestore();
    });
  });

  describe('호버', () => {
    it('올리면 열리고 벗어나면 닫힌다', async () => {
      const user = userEvent.setup();
      render(<TestTooltip />);
      await user.hover(trigger());
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
      await user.unhover(trigger());
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    // 가짜 타이머에서는 user-event가 멈추므로 포인터 이벤트를 직접 보낸다.
    it('delayDuration 이후에 열린다', () => {
      vi.useFakeTimers();
      render(<TestTooltip delayDuration={700} />);
      fireEvent.pointerEnter(trigger());
      act(() => vi.advanceTimersByTime(699));
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      act(() => vi.advanceTimersByTime(1));
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    it('지연 중에 벗어나면 열리지 않는다', () => {
      vi.useFakeTimers();
      render(<TestTooltip delayDuration={700} closeDelay={100} />);
      fireEvent.pointerEnter(trigger());
      fireEvent.pointerLeave(trigger());
      act(() => vi.advanceTimersByTime(1000));
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('Content 위로 포인터를 옮기면 유지되고, 벗어나면 닫힌다 (hoverable)', () => {
      vi.useFakeTimers();
      render(<TestTooltip closeDelay={100} />);
      fireEvent.pointerEnter(trigger());
      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      fireEvent.pointerLeave(trigger());
      act(() => vi.advanceTimersByTime(50));
      fireEvent.pointerEnter(screen.getByRole('tooltip'));
      act(() => vi.advanceTimersByTime(500));
      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      fireEvent.pointerLeave(screen.getByRole('tooltip'));
      act(() => vi.advanceTimersByTime(100));
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('키보드 / 포커스', () => {
    it('포커스를 받으면 지연 없이 열리고 blur하면 닫힌다', async () => {
      const user = userEvent.setup();
      render(<TestTooltip delayDuration={700} />);
      await user.tab(); // 바깥
      await user.tab(); // 저장
      expect(trigger()).toHaveFocus();
      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      await user.tab();
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('Esc로 닫힌다 (포커스 위치와 무관)', async () => {
      const user = userEvent.setup();
      render(<TestTooltip />);
      await user.hover(trigger());
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('onEscapeKeyDown에서 preventDefault()하면 닫히지 않는다', async () => {
      const user = userEvent.setup();
      render(<TestTooltip contentProps={{ onEscapeKeyDown: (e) => e.preventDefault() }} />);
      await user.hover(trigger());
      await user.keyboard('{Escape}');
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });
  });

  describe('클릭', () => {
    it('트리거를 누르면 닫히고, 클릭으로 생긴 포커스가 다시 열지 않는다', async () => {
      const user = userEvent.setup();
      render(<TestTooltip />);
      await user.hover(trigger());
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
      await user.click(trigger());
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('제어 모드', () => {
    it('open / onOpenChange로 제어한다', async () => {
      const onOpenChange = vi.fn();
      const user = userEvent.setup();
      render(<TestTooltip open onOpenChange={onOpenChange} />);
      await user.keyboard('{Escape}');
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    it('defaultOpen으로 처음부터 열 수 있다', () => {
      render(<TestTooltip defaultOpen />);
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });
  });

  it('언마운트 후 예약된 타이머가 상태를 바꾸지 않는다', () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { unmount } = render(<TestTooltip delayDuration={700} />);
    fireEvent.pointerEnter(trigger());
    unmount();
    act(() => vi.advanceTimersByTime(1000));
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  describe('접근성 (axe)', () => {
    it('닫힌 상태와 열린 상태 모두 위반이 없다', async () => {
      const user = userEvent.setup();
      const { container } = render(<TestTooltip />);
      expect(await axe(container)).toHaveNoViolations();
      await user.hover(trigger());
      expect(await axe(document.body)).toHaveNoViolations();
    });
  });

  it('asChild와 ref를 지원한다', async () => {
    const ref = React.createRef<HTMLDivElement>();
    const user = userEvent.setup();
    render(
      <Tooltip.Root delayDuration={0}>
        <Tooltip.Trigger asChild>
          <a href="#x">링크</a>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content ref={ref}>설명</Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>,
    );
    await user.hover(screen.getByRole('link', { name: '링크' }));
    expect(ref.current).toBe(screen.getByRole('tooltip'));
  });
});
