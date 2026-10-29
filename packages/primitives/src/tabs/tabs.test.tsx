import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { configureAxe } from 'vitest-axe';
import { Tabs, type TabsRootProps } from './index';

const axe = configureAxe({ rules: { 'color-contrast': { enabled: false } } });

function TestTabs(props: TabsRootProps) {
  return (
    <Tabs.Root {...props}>
      <Tabs.List aria-label="계정">
        <Tabs.Trigger value="a">프로필</Tabs.Trigger>
        <Tabs.Trigger value="b" disabled>
          결제
        </Tabs.Trigger>
        <Tabs.Trigger value="c">보안</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="a">프로필 내용</Tabs.Content>
      <Tabs.Content value="b">결제 내용</Tabs.Content>
      <Tabs.Content value="c">보안 내용</Tabs.Content>
    </Tabs.Root>
  );
}

const tab = (name: string) => screen.getByRole('tab', { name });

describe('Tabs', () => {
  describe('ARIA', () => {
    it('tablist · tab · tabpanel 역할과 연결 속성을 가진다', () => {
      render(<TestTabs defaultValue="a" />);
      const list = screen.getByRole('tablist', { name: '계정' });
      expect(list).toHaveAttribute('aria-orientation', 'horizontal');

      expect(tab('프로필')).toHaveAttribute('aria-selected', 'true');
      expect(tab('보안')).toHaveAttribute('aria-selected', 'false');

      const panel = screen.getByRole('tabpanel', { name: '프로필' });
      expect(panel).toHaveTextContent('프로필 내용');
      expect(tab('프로필')).toHaveAttribute('aria-controls', panel.id);
      expect(panel).toHaveAttribute('aria-labelledby', tab('프로필').id);
    });

    it('선택되지 않은 패널은 렌더하지 않는다', () => {
      render(<TestTabs defaultValue="a" />);
      expect(screen.queryByText('보안 내용')).not.toBeInTheDocument();
    });

    it('data-state로 선택 여부를 노출한다', () => {
      render(<TestTabs defaultValue="a" />);
      expect(tab('프로필')).toHaveAttribute('data-state', 'active');
      expect(tab('보안')).toHaveAttribute('data-state', 'inactive');
    });

    it('선택된 탭만 tabindex 0이다 (로빙 tabindex)', () => {
      render(<TestTabs defaultValue="c" />);
      expect(tab('보안')).toHaveAttribute('tabindex', '0');
      expect(tab('프로필')).toHaveAttribute('tabindex', '-1');
    });

    it('선택 값이 없으면 모든 탭이 Tab으로 도달 가능하다', () => {
      render(<TestTabs />);
      expect(tab('프로필')).toHaveAttribute('tabindex', '0');
      expect(tab('보안')).toHaveAttribute('tabindex', '0');
    });

    it('forceMount면 비선택 패널도 hidden으로 유지한다', () => {
      render(
        <Tabs.Root defaultValue="a">
          <Tabs.List aria-label="x">
            <Tabs.Trigger value="a">A</Tabs.Trigger>
            <Tabs.Trigger value="b">B</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">a</Tabs.Content>
          <Tabs.Content value="b" forceMount data-testid="b">
            b
          </Tabs.Content>
        </Tabs.Root>,
      );
      expect(screen.getByTestId('b')).toHaveAttribute('hidden');
    });

    it('Root 밖에서 쓰면 에러를 던진다', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<Tabs.Trigger value="a">x</Tabs.Trigger>)).toThrow('<Tabs.Trigger>은(는) <Tabs.Root> 안에서만 사용할 수 있습니다.');
      spy.mockRestore();
    });
  });

  describe('선택', () => {
    it('탭을 클릭하면 선택이 바뀐다 (비제어)', async () => {
      const user = userEvent.setup();
      render(<TestTabs defaultValue="a" />);
      await user.click(tab('보안'));
      expect(tab('보안')).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tabpanel')).toHaveTextContent('보안 내용');
    });

    it('비활성 탭은 선택되지 않는다', async () => {
      const user = userEvent.setup();
      render(<TestTabs defaultValue="a" />);
      await user.click(tab('결제'));
      expect(tab('프로필')).toHaveAttribute('aria-selected', 'true');
    });

    it('value / onValueChange로 제어한다', async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<TestTabs value="a" onValueChange={onValueChange} />);
      await user.click(tab('보안'));
      expect(onValueChange).toHaveBeenCalledWith('c');
      // 부모가 값을 바꾸지 않았으므로 선택은 그대로다.
      expect(tab('프로필')).toHaveAttribute('aria-selected', 'true');
    });

    it('이미 선택된 탭을 다시 눌러도 onValueChange를 호출하지 않는다', async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<TestTabs defaultValue="a" onValueChange={onValueChange} />);
      await user.click(tab('프로필'));
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('onClick에서 preventDefault()하면 선택하지 않는다', async () => {
      const user = userEvent.setup();
      render(
        <Tabs.Root defaultValue="a">
          <Tabs.List aria-label="x">
            <Tabs.Trigger value="a">A</Tabs.Trigger>
            <Tabs.Trigger value="b" onClick={(e) => e.preventDefault()}>
              B
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">a</Tabs.Content>
        </Tabs.Root>,
      );
      await user.click(tab('B'));
      expect(tab('A')).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('키보드 (APG)', () => {
    it('Tab으로 선택된 탭에 진입하고, 다음 Tab은 패널로 이동한다', async () => {
      const user = userEvent.setup();
      render(<TestTabs defaultValue="c" />);
      await user.tab();
      expect(tab('보안')).toHaveFocus();
      await user.tab();
      expect(screen.getByRole('tabpanel')).toHaveFocus();
    });

    it('→ / ← 로 비활성 탭을 건너뛰며 순환 이동하고 즉시 선택한다 (automatic)', async () => {
      const user = userEvent.setup();
      render(<TestTabs defaultValue="a" />);
      tab('프로필').focus();

      await user.keyboard('{ArrowRight}');
      expect(tab('보안')).toHaveFocus();
      expect(tab('보안')).toHaveAttribute('aria-selected', 'true');

      await user.keyboard('{ArrowRight}');
      expect(tab('프로필')).toHaveFocus();

      await user.keyboard('{ArrowLeft}');
      expect(tab('보안')).toHaveFocus();
    });

    it('Home / End로 처음과 끝 탭으로 이동한다', async () => {
      const user = userEvent.setup();
      render(<TestTabs defaultValue="a" />);
      tab('프로필').focus();
      await user.keyboard('{End}');
      expect(tab('보안')).toHaveFocus();
      await user.keyboard('{Home}');
      expect(tab('프로필')).toHaveFocus();
    });

    it('manual 모드에서는 이동만 하고 Enter / Space로 선택한다', async () => {
      const user = userEvent.setup();
      render(<TestTabs defaultValue="a" activationMode="manual" />);
      tab('프로필').focus();

      await user.keyboard('{ArrowRight}');
      expect(tab('보안')).toHaveFocus();
      expect(tab('보안')).toHaveAttribute('aria-selected', 'false');

      await user.keyboard('{Enter}');
      expect(tab('보안')).toHaveAttribute('aria-selected', 'true');

      await user.keyboard('{ArrowLeft}');
      await user.keyboard(' ');
      expect(tab('프로필')).toHaveAttribute('aria-selected', 'true');
    });

    it('vertical에서는 ↑ / ↓ 를 쓰고 ← / → 는 무시한다', async () => {
      const user = userEvent.setup();
      render(<TestTabs defaultValue="a" orientation="vertical" />);
      expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');
      tab('프로필').focus();

      await user.keyboard('{ArrowRight}');
      expect(tab('프로필')).toHaveFocus();
      await user.keyboard('{ArrowDown}');
      expect(tab('보안')).toHaveFocus();
    });

    it('onKeyDown에서 preventDefault()하면 이동하지 않는다', async () => {
      const user = userEvent.setup();
      render(
        <Tabs.Root defaultValue="a">
          <Tabs.List aria-label="x">
            <Tabs.Trigger value="a" onKeyDown={(e) => e.preventDefault()}>
              A
            </Tabs.Trigger>
            <Tabs.Trigger value="b">B</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>,
      );
      tab('A').focus();
      await user.keyboard('{ArrowRight}');
      expect(tab('A')).toHaveFocus();
    });
  });

  describe('접근성 (axe)', () => {
    it('위반이 없다', async () => {
      const { container } = render(<TestTabs defaultValue="a" />);
      expect(await axe(container)).toHaveNoViolations();
    });

    it('선택 값이 바뀐 뒤에도 위반이 없다', async () => {
      const user = userEvent.setup();
      const { container } = render(<TestTabs defaultValue="a" />);
      await user.click(tab('보안'));
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  it('asChild로 자식 엘리먼트에 동작을 위임한다', () => {
    render(
      <Tabs.Root defaultValue="a">
        <Tabs.List aria-label="x">
          <Tabs.Trigger value="a" asChild>
            <a href="#a">A</a>
          </Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>,
    );
    expect(screen.getByRole('tab', { name: 'A' }).tagName).toBe('A');
  });

  it('ref를 전달한다', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(
      <Tabs.Root defaultValue="a">
        <Tabs.List aria-label="x">
          <Tabs.Trigger value="a" ref={ref}>
            A
          </Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>,
    );
    expect(ref.current).toBe(tab('A'));
  });
});
