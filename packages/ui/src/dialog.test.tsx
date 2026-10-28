import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Button, Dialog } from './index';

describe('ui/Dialog', () => {
  it('프리미티브 동작을 유지하면서 스타일 클래스를 병합한다', async () => {
    const user = userEvent.setup();
    render(
      <Dialog.Root>
        <Dialog.Trigger asChild>
          <Button>열기</Button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content className="max-w-sm">
            <Dialog.Title>제목</Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="secondary">닫기</Button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>,
    );

    await user.click(screen.getByRole('button', { name: '열기' }));
    const dialog = screen.getByRole('dialog', { name: '제목' });
    // 소비자 className이 기본 max-w-lg를 덮어쓴다 (tailwind-merge).
    expect(dialog).toHaveClass('max-w-sm');
    expect(dialog).not.toHaveClass('max-w-lg');

    await user.click(screen.getByRole('button', { name: '닫기' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '열기' })).toHaveFocus();
  });
});
