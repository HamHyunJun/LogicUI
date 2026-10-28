import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { configureAxe } from 'vitest-axe';
import { Dialog, type DialogContentProps, type DialogRootProps } from './index';

// jsdom에는 캔버스가 없어 color-contrast 규칙은 검사할 수 없다 (스타일 없는 헤드리스 패키지이기도 하다).
const axe = configureAxe({ rules: { 'color-contrast': { enabled: false } } });

interface TestDialogProps extends DialogRootProps {
  contentProps?: DialogContentProps;
  withDescription?: boolean;
  extraContent?: React.ReactNode;
}

function TestDialog({ contentProps, withDescription = true, extraContent, ...rootProps }: TestDialogProps) {
  return (
    <Dialog.Root {...rootProps}>
      <Dialog.Trigger>열기</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay data-testid="overlay" />
        <Dialog.Content {...contentProps}>
          <Dialog.Title>제목</Dialog.Title>
          {withDescription && <Dialog.Description>내용</Dialog.Description>}
          <input aria-label="이름" />
          {extraContent}
          <Dialog.Close>닫기</Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ControlledDialog(props: Omit<TestDialogProps, 'open' | 'onOpenChange'>) {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <>
      <span data-testid="state">{isOpen ? 'open' : 'closed'}</span>
      <TestDialog {...props} open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}

async function openDialog() {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: '열기' }));
  return user;
}

describe('Dialog', () => {
  describe('열기/닫기', () => {
    it('트리거를 클릭하면 열리고 닫기 버튼으로 닫힌다', async () => {
      render(<TestDialog />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      const user = await openDialog();
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: '닫기' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('Enter / Space 키로 트리거를 열 수 있다', async () => {
      const user = userEvent.setup();
      render(<TestDialog />);
      const trigger = screen.getByRole('button', { name: '열기' });

      trigger.focus();
      await user.keyboard('{Enter}');
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await user.keyboard('{Escape}');
      trigger.focus();
      await user.keyboard(' ');
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('Esc 키로 닫힌다', async () => {
      render(<TestDialog />);
      const user = await openDialog();
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('onEscapeKeyDown에서 preventDefault()하면 닫히지 않는다', async () => {
      render(<TestDialog contentProps={{ onEscapeKeyDown: (e) => e.preventDefault() }} />);
      const user = await openDialog();
      await user.keyboard('{Escape}');
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('오버레이(바깥)를 누르면 닫힌다', async () => {
      render(<TestDialog />);
      const user = await openDialog();
      await user.click(screen.getByTestId('overlay'));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('onPointerDownOutside에서 preventDefault()하면 닫히지 않는다', async () => {
      render(<TestDialog contentProps={{ onPointerDownOutside: (e) => e.preventDefault() }} />);
      const user = await openDialog();
      await user.click(screen.getByTestId('overlay'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('Content 내부 클릭으로는 닫히지 않는다', async () => {
      render(<TestDialog />);
      const user = await openDialog();
      await user.click(screen.getByRole('heading', { name: '제목' }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('defaultOpen으로 처음부터 열 수 있다 (비제어)', () => {
      render(<TestDialog defaultOpen />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('제어 모드', () => {
    it('open / onOpenChange로 상태를 외부에서 제어한다', async () => {
      render(<ControlledDialog />);
      expect(screen.getByTestId('state')).toHaveTextContent('closed');

      const user = await openDialog();
      expect(screen.getByTestId('state')).toHaveTextContent('open');

      await user.keyboard('{Escape}');
      expect(screen.getByTestId('state')).toHaveTextContent('closed');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('onOpenChange가 상태를 바꾸지 않으면 열린 상태가 유지된다', async () => {
      const onOpenChange = vi.fn();
      render(<TestDialog open onOpenChange={onOpenChange} />);
      const user = userEvent.setup();
      await user.keyboard('{Escape}');
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('WAI-ARIA', () => {
    it('Content에 role, aria-modal, aria-labelledby, aria-describedby가 연결된다', async () => {
      render(<TestDialog />);
      await openDialog();
      const dialog = screen.getByRole('dialog', { name: '제목', description: '내용' });
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('data-state', 'open');
    });

    it('Description이 없으면 aria-describedby를 두지 않는다', async () => {
      render(<TestDialog withDescription={false} />);
      await openDialog();
      expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-describedby');
    });

    it('Trigger에 aria-haspopup, aria-expanded, aria-controls가 반영된다', async () => {
      render(<TestDialog />);
      const trigger = screen.getByRole('button', { name: '열기' });
      expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).not.toHaveAttribute('aria-controls');

      await openDialog();
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(trigger).toHaveAttribute('aria-controls', screen.getByRole('dialog').id);
    });

    it('열려 있는 동안 다이얼로그 바깥 요소는 inert 처리된다', async () => {
      const { container } = render(<TestDialog />);
      await openDialog();
      expect(container).toHaveAttribute('inert');
      expect(screen.getByTestId('overlay')).not.toHaveAttribute('inert');

      await userEvent.setup().keyboard('{Escape}');
      expect(container).not.toHaveAttribute('inert');
    });

    it('닫힌 상태와 열린 상태 모두 axe 위반이 없다', async () => {
      render(<TestDialog />);
      expect(await axe(document.body)).toHaveNoViolations();
      await openDialog();
      expect(await axe(document.body)).toHaveNoViolations();
    });
  });

  describe('포커스 관리', () => {
    it('열리면 첫 번째 포커스 가능한 요소로 포커스가 이동한다', async () => {
      render(<TestDialog />);
      await openDialog();
      expect(screen.getByRole('textbox', { name: '이름' })).toHaveFocus();
    });

    it('포커스 가능한 요소가 없으면 Content 자체에 포커스한다', async () => {
      render(
        <Dialog.Root defaultOpen>
          <Dialog.Portal>
            <Dialog.Content>
              <Dialog.Title>제목</Dialog.Title>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>,
      );
      expect(screen.getByRole('dialog')).toHaveFocus();
    });

    it('onOpenAutoFocus에서 preventDefault()하면 자동 포커스를 하지 않는다', async () => {
      render(<TestDialog contentProps={{ onOpenAutoFocus: (e) => e.preventDefault() }} />);
      await openDialog();
      expect(screen.getByRole('textbox', { name: '이름' })).not.toHaveFocus();
    });

    it('Tab / Shift+Tab이 다이얼로그 안에서 순환한다 (포커스 트랩)', async () => {
      render(<TestDialog />);
      const user = await openDialog();
      const input = screen.getByRole('textbox', { name: '이름' });
      const close = screen.getByRole('button', { name: '닫기' });

      expect(input).toHaveFocus();
      await user.tab();
      expect(close).toHaveFocus();
      await user.tab();
      expect(input).toHaveFocus();
      await user.tab({ shift: true });
      expect(close).toHaveFocus();
    });

    it('닫히면 트리거로 포커스가 돌아간다', async () => {
      render(<TestDialog />);
      const user = await openDialog();
      await user.keyboard('{Escape}');
      expect(screen.getByRole('button', { name: '열기' })).toHaveFocus();
    });

    it('바깥 요소로 포커스가 이동하면 다이얼로그 안으로 되돌린다', async () => {
      render(
        <>
          <button type="button">바깥 버튼</button>
          <TestDialog />
        </>,
      );
      await openDialog();
      const input = screen.getByRole('textbox', { name: '이름' });
      act(() => screen.getByRole('button', { name: '바깥 버튼', hidden: true }).focus());
      expect(input).toHaveFocus();
    });
  });

  describe('스크롤 잠금', () => {
    it('열려 있는 동안 body 스크롤을 잠그고 닫히면 복원한다', async () => {
      document.body.style.overflow = 'auto';
      render(<TestDialog />);
      const user = await openDialog();
      expect(document.body.style.overflow).toBe('hidden');
      await user.keyboard('{Escape}');
      expect(document.body.style.overflow).toBe('auto');
      document.body.style.overflow = '';
    });
  });

  describe('중첩 다이얼로그', () => {
    it('Esc는 가장 위의 다이얼로그만 닫는다', async () => {
      render(
        <TestDialog
          extraContent={
            <Dialog.Root>
              <Dialog.Trigger>하위 열기</Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Content>
                  <Dialog.Title>하위 제목</Dialog.Title>
                  <Dialog.Close>하위 닫기</Dialog.Close>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          }
        />,
      );
      const user = await openDialog();
      await user.click(screen.getByRole('button', { name: '하위 열기' }));
      expect(screen.getByRole('dialog', { name: '하위 제목' })).toBeInTheDocument();

      await user.keyboard('{Escape}');
      expect(screen.queryByRole('dialog', { name: '하위 제목' })).not.toBeInTheDocument();
      expect(screen.getByRole('dialog', { name: '제목' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '하위 열기' })).toHaveFocus();

      await user.keyboard('{Escape}');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('asChild', () => {
    it('Trigger가 자식 엘리먼트에 동작과 속성을 위임한다', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <a href="#open" onClick={onClick}>
              링크로 열기
            </a>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Content>
              <Dialog.Title>제목</Dialog.Title>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>,
      );
      const link = screen.getByRole('link', { name: '링크로 열기' });
      expect(link).toHaveAttribute('aria-haspopup', 'dialog');
      await user.click(link);
      expect(onClick).toHaveBeenCalled();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('비모달', () => {
    it('modal={false}면 aria-modal, inert, 스크롤 잠금, 오버레이가 없다', async () => {
      const { container } = render(<TestDialog modal={false} />);
      await openDialog();
      expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-modal');
      expect(container).not.toHaveAttribute('inert');
      expect(document.body.style.overflow).not.toBe('hidden');
      expect(screen.queryByTestId('overlay')).not.toBeInTheDocument();
    });

    it('비모달에서 트리거를 다시 누르면 닫힌다', async () => {
      render(<TestDialog modal={false} />);
      const user = await openDialog();
      await user.click(screen.getByRole('button', { name: '열기' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('Root 밖에서 파트를 쓰면 명확한 에러를 던진다', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Dialog.Trigger>열기</Dialog.Trigger>)).toThrow(/Dialog\.Root/);
    spy.mockRestore();
  });
});
