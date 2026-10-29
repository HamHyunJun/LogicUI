import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { configureAxe } from 'vitest-axe';
import { ToggleGroup, type ToggleGroupRootProps } from './index';

const axe = configureAxe({ rules: { 'color-contrast': { enabled: false } } });

function TestGroup({ skipCenter, ...props }: ToggleGroupRootProps & { skipCenter?: boolean }) {
  return (
    <>
      <button>앞</button>
      <ToggleGroup.Root aria-label="정렬" {...props}>
        <ToggleGroup.Item value="left">왼쪽</ToggleGroup.Item>
        <ToggleGroup.Item value="center" disabled={skipCenter}>
          가운데
        </ToggleGroup.Item>
        <ToggleGroup.Item value="right">오른쪽</ToggleGroup.Item>
      </ToggleGroup.Root>
      <button>뒤</button>
    </>
  );
}

const item = (name: string) => screen.getByRole('button', { name });

describe('ToggleGroup', () => {
  describe('ARIA', () => {
    it('group 역할 안에 aria-pressed 버튼들이 있다', () => {
      render(<TestGroup defaultValue={['center']} />);
      expect(screen.getByRole('group', { name: '정렬' })).toBeInTheDocument();
      expect(item('왼쪽')).toHaveAttribute('aria-pressed', 'false');
      expect(item('가운데')).toHaveAttribute('aria-pressed', 'true');
      expect(item('가운데')).toHaveAttribute('data-state', 'on');
      expect(item('왼쪽')).toHaveAttribute('data-state', 'off');
    });

    it('orientation과 disabled를 data 속성으로 노출한다', () => {
      render(<TestGroup orientation="vertical" disabled />);
      expect(screen.getByRole('group')).toHaveAttribute('data-orientation', 'vertical');
      expect(screen.getByRole('group')).toHaveAttribute('data-disabled');
      expect(item('왼쪽')).toBeDisabled();
    });
  });

  describe('single / multiple', () => {
    it('single은 하나만 켜지고 켜진 항목을 다시 누르면 꺼진다', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<TestGroup onValueChange={onValueChange} />);
      await user.click(item('왼쪽'));
      expect(onValueChange).toHaveBeenLastCalledWith(['left']);
      await user.click(item('오른쪽'));
      expect(onValueChange).toHaveBeenLastCalledWith(['right']);
      expect(item('왼쪽')).toHaveAttribute('aria-pressed', 'false');
      await user.click(item('오른쪽'));
      expect(onValueChange).toHaveBeenLastCalledWith([]);
    });

    it('multiple은 여러 개를 켤 수 있다', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<TestGroup type="multiple" onValueChange={onValueChange} />);
      await user.click(item('왼쪽'));
      await user.click(item('오른쪽'));
      expect(onValueChange).toHaveBeenLastCalledWith(['left', 'right']);
      expect(item('왼쪽')).toHaveAttribute('aria-pressed', 'true');
      await user.click(item('왼쪽'));
      expect(onValueChange).toHaveBeenLastCalledWith(['right']);
    });

    it('제어 모드에서는 value prop을 따른다', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const { rerender } = render(<TestGroup value={[]} onValueChange={onValueChange} />);
      await user.click(item('왼쪽'));
      expect(onValueChange).toHaveBeenCalledWith(['left']);
      expect(item('왼쪽')).toHaveAttribute('aria-pressed', 'false');
      rerender(<TestGroup value={['left']} onValueChange={onValueChange} />);
      expect(item('왼쪽')).toHaveAttribute('aria-pressed', 'true');
    });

    it('비활성 항목은 눌러도 바뀌지 않는다', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<TestGroup skipCenter onValueChange={onValueChange} />);
      await user.click(item('가운데'));
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('onClick에서 preventDefault()하면 바뀌지 않는다', async () => {
      const user = userEvent.setup();
      render(
        <ToggleGroup.Root aria-label="x">
          <ToggleGroup.Item value="a" onClick={(e) => e.preventDefault()}>
            A
          </ToggleGroup.Item>
        </ToggleGroup.Root>,
      );
      await user.click(screen.getByRole('button', { name: 'A' }));
      expect(screen.getByRole('button', { name: 'A' })).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('로빙 tabindex와 키보드', () => {
    it('켜진 첫 항목(없으면 첫 항목)만 tabindex=0이다', () => {
      const { unmount } = render(<TestGroup />);
      expect(item('왼쪽')).toHaveAttribute('tabindex', '0');
      expect(item('가운데')).toHaveAttribute('tabindex', '-1');
      unmount();
      render(<TestGroup defaultValue={['right']} />);
      expect(item('오른쪽')).toHaveAttribute('tabindex', '0');
      expect(item('왼쪽')).toHaveAttribute('tabindex', '-1');
    });

    it('Tab은 그룹에 한 번만 멈춘다', async () => {
      const user = userEvent.setup();
      render(<TestGroup />);
      await user.tab();
      await user.tab();
      expect(item('왼쪽')).toHaveFocus();
      await user.tab();
      expect(item('뒤')).toHaveFocus();
    });

    it('ArrowRight/Left는 포커스만 옮기고 선택하지 않으며 끝에서 순환한다', async () => {
      const user = userEvent.setup();
      render(<TestGroup />);
      item('왼쪽').focus();
      await user.keyboard('{ArrowRight}');
      expect(item('가운데')).toHaveFocus();
      expect(item('가운데')).toHaveAttribute('aria-pressed', 'false');
      await user.keyboard('{ArrowRight}{ArrowRight}');
      expect(item('왼쪽')).toHaveFocus();
      await user.keyboard('{ArrowLeft}');
      expect(item('오른쪽')).toHaveFocus();
    });

    it('포커스를 옮기면 그 항목이 새 탭 정지점이 된다', async () => {
      const user = userEvent.setup();
      render(<TestGroup />);
      item('왼쪽').focus();
      await user.keyboard('{ArrowRight}');
      expect(item('가운데')).toHaveAttribute('tabindex', '0');
      expect(item('왼쪽')).toHaveAttribute('tabindex', '-1');
    });

    it('loop={false}면 끝에서 멈춘다', async () => {
      const user = userEvent.setup();
      render(<TestGroup loop={false} />);
      item('왼쪽').focus();
      await user.keyboard('{ArrowLeft}');
      expect(item('왼쪽')).toHaveFocus();
    });

    it('vertical에서는 ArrowDown/Up으로 이동하고 ArrowRight는 무시한다', async () => {
      const user = userEvent.setup();
      render(<TestGroup orientation="vertical" />);
      item('왼쪽').focus();
      await user.keyboard('{ArrowRight}');
      expect(item('왼쪽')).toHaveFocus();
      await user.keyboard('{ArrowDown}');
      expect(item('가운데')).toHaveFocus();
    });

    it('Home/End는 처음/마지막 항목으로 옮기고, 비활성 항목은 건너뛴다', async () => {
      const user = userEvent.setup();
      render(<TestGroup skipCenter />);
      item('왼쪽').focus();
      await user.keyboard('{End}');
      expect(item('오른쪽')).toHaveFocus();
      await user.keyboard('{Home}');
      expect(item('왼쪽')).toHaveFocus();
      await user.keyboard('{ArrowRight}');
      expect(item('오른쪽')).toHaveFocus();
    });

    it('Space와 Enter로 전환한다', async () => {
      const user = userEvent.setup();
      render(<TestGroup type="multiple" />);
      item('왼쪽').focus();
      await user.keyboard(' ');
      expect(item('왼쪽')).toHaveAttribute('aria-pressed', 'true');
      await user.keyboard('{Enter}');
      expect(item('왼쪽')).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('에러', () => {
    it('Root 밖에서 Item을 쓰면 에러를 던진다', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<ToggleGroup.Item value="a" />)).toThrow('<ToggleGroup.Item>은(는) <ToggleGroup.Root> 안에서만 사용할 수 있습니다.');
      spy.mockRestore();
    });
  });

  describe('접근성 (axe)', () => {
    it('선택 전과 후 모두 위반이 없다', async () => {
      const { container, rerender } = render(<TestGroup />);
      expect(await axe(container)).toHaveNoViolations();
      rerender(<TestGroup value={['left']} />);
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
