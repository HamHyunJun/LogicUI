import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { configureAxe } from 'vitest-axe';
import { Popover, type PopoverContentProps, type PopoverRootProps } from './index';

const axe = configureAxe({ rules: { 'color-contrast': { enabled: false } } });

interface TestPopoverProps extends PopoverRootProps {
  contentProps?: PopoverContentProps;
}

function TestPopover({ contentProps, ...rootProps }: TestPopoverProps) {
  return (
    <>
      <button>바깥</button>
      <Popover.Root {...rootProps}>
        <Popover.Trigger>열기</Popover.Trigger>
        <Popover.Portal>
          <Popover.Content aria-label="설정" {...contentProps}>
            <input aria-label="이름" />
            <Popover.Close>닫기</Popover.Close>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </>
  );
}

async function openPopover() {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: '열기' }));
  return user;
}

describe('Popover', () => {
  describe('ARIA', () => {
    it('Trigger는 aria-haspopup/expanded/controls를 가진다', async () => {
      render(<TestPopover />);
      const trigger = screen.getByRole('button', { name: '열기' });
      expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).not.toHaveAttribute('aria-controls');

      await openPopover();
      const dialog = screen.getByRole('dialog', { name: '설정' });
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(trigger).toHaveAttribute('aria-controls', dialog.id);
    });

    it('비모달이다: aria-modal이 없고 바깥 요소가 inert되지 않는다', async () => {
      render(<TestPopover />);
      await openPopover();
      expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-modal');
      expect(screen.getByRole('button', { name: '바깥' })).not.toHaveAttribute('inert');
    });

    it('data-state / data-side를 노출하고 fixed로 배치한다', async () => {
      render(<TestPopover contentProps={{ side: 'top' }} />);
      await openPopover();
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('data-state', 'open');
      expect(dialog.style.position).toBe('fixed');
      expect(dialog.dataset.side).toBeDefined();
    });

    it('Root 밖에서 쓰면 에러를 던진다', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<Popover.Trigger>x</Popover.Trigger>)).toThrow('<Popover.Trigger>은(는) <Popover.Root> 안에서만 사용할 수 있습니다.');
      spy.mockRestore();
    });
  });

  describe('열기/닫기', () => {
    it('트리거 클릭으로 토글한다', async () => {
      render(<TestPopover />);
      const user = await openPopover();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: '열기' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('Enter / Space로 열 수 있다', async () => {
      const user = userEvent.setup();
      render(<TestPopover />);
      screen.getByRole('button', { name: '열기' }).focus();
      await user.keyboard('{Enter}');
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('Esc로 닫히고 트리거로 포커스가 돌아간다', async () => {
      render(<TestPopover />);
      const user = await openPopover();
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: '열기' })).toHaveFocus();
    });

    it('Close 버튼으로 닫힌다', async () => {
      render(<TestPopover />);
      const user = await openPopover();
      await user.click(screen.getByRole('button', { name: '닫기' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('바깥을 누르면 닫히고, 포커스를 가져간 바깥 요소의 포커스는 빼앗지 않는다', async () => {
      render(<TestPopover />);
      const user = await openPopover();
      await user.click(screen.getByRole('button', { name: '바깥' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: '바깥' })).toHaveFocus();
    });

    it('Content 내부 클릭으로는 닫히지 않는다', async () => {
      render(<TestPopover />);
      const user = await openPopover();
      await user.click(screen.getByRole('textbox', { name: '이름' }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('포커스가 바깥으로 이동하면 닫힌다', async () => {
      render(<TestPopover />);
      await openPopover();
      act(() => screen.getByRole('button', { name: '바깥' }).focus());
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('포커스', () => {
    it('열리면 첫 tabbable 요소로 포커스가 이동한다', async () => {
      render(<TestPopover />);
      await openPopover();
      expect(screen.getByRole('textbox', { name: '이름' })).toHaveFocus();
    });

    it('onOpenAutoFocus에서 preventDefault()하면 포커스를 옮기지 않는다', async () => {
      render(<TestPopover contentProps={{ onOpenAutoFocus: (e) => e.preventDefault() }} />);
      await openPopover();
      expect(screen.getByRole('textbox', { name: '이름' })).not.toHaveFocus();
    });
  });

  describe('취소 가능한 콜백', () => {
    it('onEscapeKeyDown에서 preventDefault()하면 닫히지 않는다', async () => {
      render(<TestPopover contentProps={{ onEscapeKeyDown: (e) => e.preventDefault() }} />);
      const user = await openPopover();
      await user.keyboard('{Escape}');
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('onPointerDownOutside에서 preventDefault()하면 닫히지 않는다', async () => {
      render(<TestPopover contentProps={{ onPointerDownOutside: (e) => e.preventDefault() }} />);
      const user = await openPopover();
      await user.click(screen.getByRole('button', { name: '바깥' }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('제어 모드', () => {
    it('open / onOpenChange로 제어한다', async () => {
      const onOpenChange = vi.fn();
      render(<TestPopover open onOpenChange={onOpenChange} />);
      const user = userEvent.setup();
      await user.keyboard('{Escape}');
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('defaultOpen으로 처음부터 열 수 있다', () => {
      render(<TestPopover defaultOpen />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('중첩', () => {
    it('Esc는 가장 위 팝오버만 닫는다', async () => {
      const user = userEvent.setup();
      render(
        <Popover.Root defaultOpen>
          <Popover.Trigger>바깥 열기</Popover.Trigger>
          <Popover.Portal>
            <Popover.Content aria-label="바깥">
              <Popover.Root defaultOpen>
                <Popover.Trigger>안쪽 열기</Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content aria-label="안쪽">
                    <button>안쪽 버튼</button>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>,
      );
      expect(screen.getAllByRole('dialog')).toHaveLength(2);
      await user.keyboard('{Escape}');
      expect(screen.getAllByRole('dialog')).toHaveLength(1);
      expect(screen.getByRole('dialog', { name: '바깥' })).toBeInTheDocument();
    });
  });

  describe('접근성 (axe)', () => {
    it('닫힌 상태와 열린 상태 모두 위반이 없다', async () => {
      const { container } = render(<TestPopover />);
      expect(await axe(container)).toHaveNoViolations();
      await openPopover();
      expect(await axe(document.body)).toHaveNoViolations();
    });
  });

  it('asChild와 ref를 지원한다', async () => {
    const ref = React.createRef<HTMLDivElement>();
    const user = userEvent.setup();
    render(
      <Popover.Root>
        <Popover.Trigger asChild>
          <a href="#x">링크</a>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content ref={ref} aria-label="설정">
            내용
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>,
    );
    await user.click(screen.getByRole('link', { name: '링크' }));
    expect(ref.current).toBe(screen.getByRole('dialog'));
  });
});
