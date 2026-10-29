import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { configureAxe } from 'vitest-axe';
import { AlertDialog, type AlertDialogContentProps, type AlertDialogRootProps } from './index';

const axe = configureAxe({ rules: { 'color-contrast': { enabled: false } } });

function TestAlert({ contentProps, withCancel = true, onAction, ...rootProps }: AlertDialogRootProps & { contentProps?: AlertDialogContentProps; withCancel?: boolean; onAction?: () => void }) {
  return (
    <>
      <button>바깥</button>
      <AlertDialog.Root {...rootProps}>
        <AlertDialog.Trigger>삭제</AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Overlay data-testid="overlay" />
          <AlertDialog.Content {...contentProps}>
            <AlertDialog.Title>정말 삭제할까요?</AlertDialog.Title>
            <AlertDialog.Description>이 작업은 되돌릴 수 없습니다.</AlertDialog.Description>
            <AlertDialog.Action onClick={onAction}>삭제하기</AlertDialog.Action>
            {withCancel && <AlertDialog.Cancel>취소</AlertDialog.Cancel>}
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}

const open = async () => {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: '삭제' }));
  return user;
};

describe('AlertDialog', () => {
  describe('ARIA', () => {
    it('role="alertdialog"이고 모달이며 제목·설명과 연결된다', async () => {
      render(<TestAlert />);
      await open();
      const dialog = screen.getByRole('alertdialog', { name: '정말 삭제할까요?' });
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAccessibleDescription('이 작업은 되돌릴 수 없습니다.');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('Trigger는 aria-haspopup/expanded를 가지고 열리면 바깥이 inert 처리된다', async () => {
      render(<TestAlert />);
      const trigger = screen.getByRole('button', { name: '삭제' });
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await open();
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('button', { name: '바깥', hidden: true }).closest('[inert]')).not.toBeNull();
      expect(screen.getByTestId('overlay')).toBeInTheDocument();
    });
  });

  describe('포커스', () => {
    it('열리면 Cancel에 포커스한다(가장 안전한 선택지)', async () => {
      render(<TestAlert />);
      await open();
      expect(screen.getByRole('button', { name: '취소' })).toHaveFocus();
    });

    it('Cancel이 없으면 첫 tabbable 요소에 포커스한다', async () => {
      render(<TestAlert withCancel={false} />);
      await open();
      expect(screen.getByRole('button', { name: '삭제하기' })).toHaveFocus();
    });

    it('onOpenAutoFocus에서 preventDefault()하면 Cancel로 옮기지 않는다', async () => {
      render(<TestAlert contentProps={{ onOpenAutoFocus: (e) => e.preventDefault() }} />);
      await open();
      expect(screen.getByRole('button', { name: '취소' })).not.toHaveFocus();
    });

    it('Tab·Shift+Tab 포커스가 다이얼로그 안에서 순환한다', async () => {
      render(<TestAlert />);
      const user = await open();
      expect(screen.getByRole('button', { name: '취소' })).toHaveFocus(); // 마지막 요소
      await user.tab();
      expect(screen.getByRole('button', { name: '삭제하기' })).toHaveFocus(); // 첫 요소로 순환
      await user.tab({ shift: true });
      expect(screen.getByRole('button', { name: '취소' })).toHaveFocus(); // 마지막 요소로 순환
    });

    it('닫히면 트리거로 포커스가 돌아간다', async () => {
      render(<TestAlert />);
      const user = await open();
      await user.click(screen.getByRole('button', { name: '취소' }));
      expect(screen.getByRole('button', { name: '삭제' })).toHaveFocus();
    });
  });

  describe('닫기', () => {
    it('Esc로 닫힌다', async () => {
      render(<TestAlert />);
      const user = await open();
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('onEscapeKeyDown에서 preventDefault()하면 Esc로 닫히지 않는다', async () => {
      render(<TestAlert contentProps={{ onEscapeKeyDown: (e) => e.preventDefault() }} />);
      const user = await open();
      await user.keyboard('{Escape}');
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('바깥(오버레이)을 눌러도 닫히지 않는다', async () => {
      render(<TestAlert />);
      const user = await open();
      await user.click(screen.getByTestId('overlay'));
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('Cancel은 아무 동작 없이 닫고, Action은 onClick을 호출하고 닫는다', async () => {
      const onAction = vi.fn();
      render(<TestAlert onAction={onAction} />);
      const user = await open();
      await user.click(screen.getByRole('button', { name: '취소' }));
      expect(onAction).not.toHaveBeenCalled();
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: '삭제' }));
      await user.click(screen.getByRole('button', { name: '삭제하기' }));
      expect(onAction).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });

  describe('제어·비제어와 에러', () => {
    it('defaultOpen이면 처음부터 열려 있다', () => {
      render(<TestAlert defaultOpen />);
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('제어 모드에서는 open prop을 따르고 onOpenChange를 호출한다', async () => {
      const onOpenChange = vi.fn();
      const user = userEvent.setup();
      render(<TestAlert open onOpenChange={onOpenChange} />);
      await user.click(screen.getByRole('button', { name: '취소' }));
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('Root 밖에서 Content·Cancel을 쓰면 에러를 던진다', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<AlertDialog.Cancel>x</AlertDialog.Cancel>)).toThrow('<AlertDialog.Cancel>은(는) <AlertDialog.Root> 안에서만 사용할 수 있습니다.');
      spy.mockRestore();
    });
  });

  describe('접근성 (axe)', () => {
    it('닫힌 상태와 열린 상태에 위반이 없다', async () => {
      const { container } = render(<TestAlert />);
      expect(await axe(container)).toHaveNoViolations();
      await open();
      expect(await axe(document.body)).toHaveNoViolations();
    });
  });
});
