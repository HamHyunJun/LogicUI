import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { configureAxe } from 'vitest-axe';
import { Menu, type MenuContentProps, type MenuRootProps } from './index';

// 포털로 body에 붙는 메뉴는 테스트 문서에 landmark가 없어 region 규칙이 실패하므로 끈다.
const axe = configureAxe({ rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } });

interface TestMenuProps extends MenuRootProps {
  contentProps?: MenuContentProps;
  onSelectItem?: (name: string, event: Event) => void;
}

function TestMenu({ contentProps, onSelectItem, ...rootProps }: TestMenuProps) {
  const select = (name: string) => (event: Event) => onSelectItem?.(name, event);
  return (
    <>
      <button>바깥</button>
      <Menu.Root {...rootProps}>
        <Menu.Trigger>메뉴</Menu.Trigger>
        <Menu.Portal>
          <Menu.Content {...contentProps}>
            <Menu.Item onSelect={select('New')}>New</Menu.Item>
            <Menu.Item onSelect={select('Open')}>Open</Menu.Item>
            <Menu.Item disabled onSelect={select('Print')}>
              Print
            </Menu.Item>
            <Menu.Separator />
            <Menu.Item onSelect={select('Save')}>Save</Menu.Item>
            <Menu.Item onSelect={select('Save As')}>Save As</Menu.Item>
          </Menu.Content>
        </Menu.Portal>
      </Menu.Root>
    </>
  );
}

const trigger = () => screen.getByRole('button', { name: '메뉴' });

describe('Menu', () => {
  describe('ARIA', () => {
    it('Trigger는 aria-haspopup="menu", aria-expanded, aria-controls를 가진다', async () => {
      const user = userEvent.setup();
      render(<TestMenu />);
      expect(trigger()).toHaveAttribute('aria-haspopup', 'menu');
      expect(trigger()).toHaveAttribute('aria-expanded', 'false');
      expect(trigger()).not.toHaveAttribute('aria-controls');

      await user.click(trigger());
      const menu = screen.getByRole('menu');
      expect(trigger()).toHaveAttribute('aria-expanded', 'true');
      expect(trigger()).toHaveAttribute('aria-controls', menu.id);
    });

    it('menu는 Trigger로 이름이 붙고 항목은 menuitem 역할을 가진다', async () => {
      const user = userEvent.setup();
      render(<TestMenu />);
      await user.click(trigger());
      expect(screen.getByRole('menu', { name: '메뉴' })).toHaveAttribute('aria-orientation', 'vertical');
      expect(screen.getAllByRole('menuitem')).toHaveLength(5);
      expect(screen.getByRole('separator')).toBeInTheDocument();
    });

    it('비활성 항목은 aria-disabled와 data-disabled를 가진다', async () => {
      const user = userEvent.setup();
      render(<TestMenu />);
      await user.click(trigger());
      const print = screen.getByRole('menuitem', { name: 'Print' });
      expect(print).toHaveAttribute('aria-disabled', 'true');
      expect(print).toHaveAttribute('data-disabled');
    });

    it('data-state / data-side를 노출한다', async () => {
      const user = userEvent.setup();
      render(<TestMenu contentProps={{ side: 'top' }} />);
      expect(trigger()).toHaveAttribute('data-state', 'closed');
      await user.click(trigger());
      expect(trigger()).toHaveAttribute('data-state', 'open');
      expect(screen.getByRole('menu')).toHaveAttribute('data-state', 'open');
      // jsdom에는 레이아웃이 없어 실제 방향(뒤집힘 포함)은 E2E에서 확인한다.
      expect(screen.getByRole('menu').style.position).toBe('fixed');
      expect(screen.getByRole('menu').dataset.side).toBeDefined();
    });

    it('소비자가 Trigger에 준 id를 menu의 이름 연결에 사용한다', async () => {
      const user = userEvent.setup();
      render(
        <Menu.Root>
          <Menu.Trigger id="my-trigger">파일</Menu.Trigger>
          <Menu.Portal>
            <Menu.Content>
              <Menu.Item>New</Menu.Item>
            </Menu.Content>
          </Menu.Portal>
        </Menu.Root>,
      );
      await user.click(screen.getByRole('button', { name: '파일' }));
      expect(screen.getByRole('menu')).toHaveAttribute('aria-labelledby', 'my-trigger');
    });
  });

  describe('Trigger 키보드', () => {
    it('Enter로 열면 첫 항목에 포커스한다', async () => {
      const user = userEvent.setup();
      render(<TestMenu />);
      trigger().focus();
      await user.keyboard('{Enter}');
      expect(screen.getByRole('menuitem', { name: 'New' })).toHaveFocus();
    });

    it('Space로 열면 첫 항목에 포커스한다', async () => {
      const user = userEvent.setup();
      render(<TestMenu />);
      trigger().focus();
      await user.keyboard(' ');
      expect(screen.getByRole('menuitem', { name: 'New' })).toHaveFocus();
    });

    it('ArrowDown으로 열면 첫 항목에 포커스한다', async () => {
      const user = userEvent.setup();
      render(<TestMenu />);
      trigger().focus();
      await user.keyboard('{ArrowDown}');
      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'New' })).toHaveFocus();
    });

    it('ArrowUp으로 열면 마지막 활성 항목에 포커스한다', async () => {
      const user = userEvent.setup();
      render(<TestMenu />);
      trigger().focus();
      await user.keyboard('{ArrowUp}');
      expect(screen.getByRole('menuitem', { name: 'Save As' })).toHaveFocus();
    });

    it('마우스 클릭으로 열어도 첫 항목에 포커스한다', async () => {
      const user = userEvent.setup();
      render(<TestMenu />);
      await user.click(trigger());
      expect(screen.getByRole('menuitem', { name: 'New' })).toHaveFocus();
    });

    it('다시 클릭하면 닫힌다', async () => {
      const user = userEvent.setup();
      render(<TestMenu />);
      await user.click(trigger());
      await user.click(trigger());
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  describe('Menu 키보드', () => {
    it('ArrowDown은 다음 항목으로, 비활성 항목은 건너뛰고, 끝에서는 처음으로 순환한다', async () => {
      const user = userEvent.setup();
      render(<TestMenu />);
      await user.click(trigger());
      await user.keyboard('{ArrowDown}');
      expect(screen.getByRole('menuitem', { name: 'Open' })).toHaveFocus();
      await user.keyboard('{ArrowDown}');
      expect(screen.getByRole('menuitem', { name: 'Save' })).toHaveFocus(); // Print 건너뜀
      await user.keyboard('{ArrowDown}{ArrowDown}');
      expect(screen.getByRole('menuitem', { name: 'New' })).toHaveFocus();
    });

    it('ArrowUp은 이전 항목으로, 처음에서는 마지막으로 순환한다', async () => {
      const user = userEvent.setup();
      render(<TestMenu />);
      await user.click(trigger());
      await user.keyboard('{ArrowUp}');
      expect(screen.getByRole('menuitem', { name: 'Save As' })).toHaveFocus();
      await user.keyboard('{ArrowUp}');
      expect(screen.getByRole('menuitem', { name: 'Save' })).toHaveFocus();
    });

    it('Home은 첫 항목으로, End는 마지막 활성 항목으로 이동한다', async () => {
      const user = userEvent.setup();
      render(<TestMenu />);
      await user.click(trigger());
      await user.keyboard('{End}');
      expect(screen.getByRole('menuitem', { name: 'Save As' })).toHaveFocus();
      await user.keyboard('{Home}');
      expect(screen.getByRole('menuitem', { name: 'New' })).toHaveFocus();
    });

    it('글자를 입력하면 그 글자로 시작하는 다음 항목으로 이동한다', async () => {
      const user = userEvent.setup();
      render(<TestMenu />);
      await user.click(trigger());
      await user.keyboard('o');
      expect(screen.getByRole('menuitem', { name: 'Open' })).toHaveFocus();
    });

    it('같은 글자를 반복하면 일치하는 항목을 순환한다', async () => {
      const user = userEvent.setup();
      render(<TestMenu />);
      await user.click(trigger());
      await user.keyboard('s');
      expect(screen.getByRole('menuitem', { name: 'Save' })).toHaveFocus();
      await user.keyboard('s');
      expect(screen.getByRole('menuitem', { name: 'Save As' })).toHaveFocus();
      await user.keyboard('s');
      expect(screen.getByRole('menuitem', { name: 'Save' })).toHaveFocus();
    });

    it('여러 글자를 이어서 입력하면 접두사가 일치하는 항목으로 이동한다', async () => {
      const user = userEvent.setup();
      render(<TestMenu />);
      await user.click(trigger());
      await user.keyboard('save a');
      expect(screen.getByRole('menuitem', { name: 'Save As' })).toHaveFocus();
    });

    it('비활성 항목은 글자 탐색에서도 제외된다', async () => {
      const user = userEvent.setup();
      render(<TestMenu />);
      await user.click(trigger());
      await user.keyboard('p');
      expect(screen.getByRole('menuitem', { name: 'New' })).toHaveFocus();
    });

    it('Enter로 항목을 선택하면 onSelect가 호출되고 메뉴가 닫히며 트리거로 포커스가 돌아간다', async () => {
      const user = userEvent.setup();
      const onSelectItem = vi.fn();
      render(<TestMenu onSelectItem={onSelectItem} />);
      await user.click(trigger());
      await user.keyboard('{ArrowDown}{Enter}');
      expect(onSelectItem).toHaveBeenCalledWith('Open', expect.any(Event));
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(trigger()).toHaveFocus();
    });

    it('Space로 항목을 선택한다', async () => {
      const user = userEvent.setup();
      const onSelectItem = vi.fn();
      render(<TestMenu onSelectItem={onSelectItem} />);
      await user.click(trigger());
      await user.keyboard(' ');
      expect(onSelectItem).toHaveBeenCalledWith('New', expect.any(Event));
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('Esc로 닫히고 트리거로 포커스가 돌아간다', async () => {
      const user = userEvent.setup();
      render(<TestMenu />);
      await user.click(trigger());
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(trigger()).toHaveFocus();
    });

    it('Tab을 누르면 닫히고 트리거로 포커스가 돌아간다', async () => {
      const user = userEvent.setup();
      render(<TestMenu />);
      await user.click(trigger());
      await user.keyboard('{Tab}');
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(trigger()).toHaveFocus();
    });
  });

  describe('포인터', () => {
    it('항목을 클릭하면 선택되고 닫힌다', async () => {
      const user = userEvent.setup();
      const onSelectItem = vi.fn();
      render(<TestMenu onSelectItem={onSelectItem} />);
      await user.click(trigger());
      await user.click(screen.getByRole('menuitem', { name: 'Save' }));
      expect(onSelectItem).toHaveBeenCalledWith('Save', expect.any(Event));
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('비활성 항목은 클릭해도 선택되지 않고 닫히지 않는다', async () => {
      const user = userEvent.setup();
      const onSelectItem = vi.fn();
      render(<TestMenu onSelectItem={onSelectItem} />);
      await user.click(trigger());
      await user.click(screen.getByRole('menuitem', { name: 'Print' }));
      expect(onSelectItem).not.toHaveBeenCalled();
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('마우스를 올린 항목이 포커스를 받고, 벗어나면 메뉴로 포커스가 돌아간다', async () => {
      const user = userEvent.setup();
      render(<TestMenu />);
      await user.click(trigger());
      const save = screen.getByRole('menuitem', { name: 'Save' });
      await user.hover(save);
      expect(save).toHaveFocus();
      await user.unhover(save);
      expect(screen.getByRole('menu')).toHaveFocus();
    });

    it('바깥을 클릭하면 닫히지만 포커스를 빼앗지 않는다', async () => {
      const user = userEvent.setup();
      render(<TestMenu />);
      await user.click(trigger());
      await user.click(screen.getByRole('button', { name: '바깥' }));
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: '바깥' })).toHaveFocus();
    });
  });

  describe('CheckboxItem', () => {
    it('menuitemcheckbox 역할과 aria-checked를 가지며 선택하면 토글된다', async () => {
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      render(
        <Menu.Root defaultOpen>
          <Menu.Trigger>보기</Menu.Trigger>
          <Menu.Portal>
            <Menu.Content>
              <Menu.CheckboxItem onCheckedChange={onCheckedChange}>눈금자</Menu.CheckboxItem>
            </Menu.Content>
          </Menu.Portal>
        </Menu.Root>,
      );
      const item = screen.getByRole('menuitemcheckbox', { name: '눈금자' });
      expect(item).toHaveAttribute('aria-checked', 'false');
      expect(item).toHaveAttribute('data-state', 'unchecked');
      await user.click(item);
      expect(onCheckedChange).toHaveBeenCalledWith(true);
    });

    it('제어 모드에서는 checked prop을 따르고, preventDefault()하면 메뉴가 열려 있다', async () => {
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      render(
        <Menu.Root defaultOpen>
          <Menu.Trigger>보기</Menu.Trigger>
          <Menu.Portal>
            <Menu.Content>
              <Menu.CheckboxItem checked onCheckedChange={onCheckedChange} onSelect={(e) => e.preventDefault()}>
                눈금자
              </Menu.CheckboxItem>
            </Menu.Content>
          </Menu.Portal>
        </Menu.Root>,
      );
      const item = screen.getByRole('menuitemcheckbox', { name: '눈금자' });
      expect(item).toHaveAttribute('aria-checked', 'true');
      await user.click(item);
      expect(onCheckedChange).toHaveBeenCalledWith(false);
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('비제어 모드에서 defaultChecked로 시작하고 선택할 때마다 바뀐다', async () => {
      const user = userEvent.setup();
      render(
        <Menu.Root defaultOpen>
          <Menu.Trigger>보기</Menu.Trigger>
          <Menu.Portal>
            <Menu.Content>
              <Menu.CheckboxItem defaultChecked onSelect={(e) => e.preventDefault()}>
                눈금자
              </Menu.CheckboxItem>
            </Menu.Content>
          </Menu.Portal>
        </Menu.Root>,
      );
      const item = screen.getByRole('menuitemcheckbox', { name: '눈금자' });
      expect(item).toHaveAttribute('aria-checked', 'true');
      await user.click(item);
      expect(item).toHaveAttribute('aria-checked', 'false');
      expect(item).toHaveAttribute('data-state', 'unchecked');
    });
  });

  describe('RadioGroup', () => {
    function RadioMenu(props: { value?: string; onValueChange?: (v: string) => void }) {
      return (
        <Menu.Root defaultOpen>
          <Menu.Trigger>정렬</Menu.Trigger>
          <Menu.Portal>
            <Menu.Content>
              <Menu.RadioGroup aria-label="정렬 기준" defaultValue="name" {...props}>
                <Menu.RadioItem value="name" onSelect={(e) => e.preventDefault()}>
                  이름
                </Menu.RadioItem>
                <Menu.RadioItem value="date" onSelect={(e) => e.preventDefault()}>
                  날짜
                </Menu.RadioItem>
              </Menu.RadioGroup>
            </Menu.Content>
          </Menu.Portal>
        </Menu.Root>
      );
    }

    it('group 안에서 menuitemradio가 하나만 선택된다', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<RadioMenu onValueChange={onValueChange} />);
      expect(screen.getByRole('group', { name: '정렬 기준' })).toBeInTheDocument();
      const name = screen.getByRole('menuitemradio', { name: '이름' });
      const date = screen.getByRole('menuitemradio', { name: '날짜' });
      expect(name).toHaveAttribute('aria-checked', 'true');
      expect(date).toHaveAttribute('aria-checked', 'false');

      await user.click(date);
      expect(onValueChange).toHaveBeenCalledWith('date');
      expect(date).toHaveAttribute('aria-checked', 'true');
      expect(name).toHaveAttribute('aria-checked', 'false');
    });

    it('제어 모드에서는 value prop을 따른다', async () => {
      const user = userEvent.setup();
      render(<RadioMenu value="date" />);
      expect(screen.getByRole('menuitemradio', { name: '날짜' })).toHaveAttribute('aria-checked', 'true');
      await user.click(screen.getByRole('menuitemradio', { name: '이름' }));
      expect(screen.getByRole('menuitemradio', { name: '날짜' })).toHaveAttribute('aria-checked', 'true');
    });

    it('RadioGroup 밖의 RadioItem은 에러를 던진다', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() =>
        render(
          <Menu.Root defaultOpen>
            <Menu.Trigger>x</Menu.Trigger>
            <Menu.Portal>
              <Menu.Content>
                <Menu.RadioItem value="a">A</Menu.RadioItem>
              </Menu.Content>
            </Menu.Portal>
          </Menu.Root>,
        ),
      ).toThrow('<Menu.RadioItem>은(는) <Menu.RadioGroup> 안에서만 사용할 수 있습니다.');
      spy.mockRestore();
    });
  });

  describe('제어·비제어와 취소', () => {
    it('defaultOpen이면 처음부터 열려 있다', () => {
      render(<TestMenu defaultOpen />);
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('제어 모드에서는 open prop을 따르고 onOpenChange를 호출한다', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      const { rerender } = render(<TestMenu open={false} onOpenChange={onOpenChange} />);
      await user.click(trigger());
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      rerender(<TestMenu open onOpenChange={onOpenChange} />);
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('onEscapeKeyDown에서 preventDefault()하면 Esc로 닫히지 않는다', async () => {
      const user = userEvent.setup();
      render(<TestMenu contentProps={{ onEscapeKeyDown: (e) => e.preventDefault() }} />);
      await user.click(trigger());
      await user.keyboard('{Escape}');
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('onPointerDownOutside에서 preventDefault()하면 바깥 클릭으로 닫히지 않는다', async () => {
      const user = userEvent.setup();
      render(<TestMenu contentProps={{ onPointerDownOutside: (e) => e.preventDefault() }} />);
      await user.click(trigger());
      await user.click(screen.getByRole('button', { name: '바깥' }));
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('항목의 onSelect에서 preventDefault()하면 메뉴가 닫히지 않는다', async () => {
      const user = userEvent.setup();
      render(<TestMenu onSelectItem={(_, event) => event.preventDefault()} />);
      await user.click(trigger());
      await user.click(screen.getByRole('menuitem', { name: 'Open' }));
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('onOpenAutoFocus에서 preventDefault()하면 첫 항목으로 포커스를 옮기지 않는다', async () => {
      const user = userEvent.setup();
      render(<TestMenu contentProps={{ onOpenAutoFocus: (e) => e.preventDefault() }} />);
      await user.click(trigger());
      expect(screen.getByRole('menuitem', { name: 'New' })).not.toHaveFocus();
    });

    it('onCloseAutoFocus에서 preventDefault()하면 트리거로 포커스를 돌려주지 않는다', async () => {
      const user = userEvent.setup();
      render(<TestMenu contentProps={{ onCloseAutoFocus: (e) => e.preventDefault() }} />);
      await user.click(trigger());
      await user.keyboard('{Escape}');
      expect(trigger()).not.toHaveFocus();
    });

    it('소비자의 onKeyDown이 preventDefault()하면 내부 키 처리를 건너뛴다', async () => {
      const user = userEvent.setup();
      render(<TestMenu contentProps={{ onKeyDown: (e) => e.preventDefault() }} />);
      await user.click(trigger());
      await user.keyboard('{ArrowDown}');
      expect(screen.getByRole('menuitem', { name: 'New' })).toHaveFocus();
    });
  });

  describe('asChild와 에러', () => {
    it('Item asChild는 자식 엘리먼트에 역할과 동작을 위임한다', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(
        <Menu.Root defaultOpen>
          <Menu.Trigger>링크</Menu.Trigger>
          <Menu.Portal>
            <Menu.Content>
              <Menu.Item asChild onSelect={onSelect}>
                <a href="#docs">문서</a>
              </Menu.Item>
            </Menu.Content>
          </Menu.Portal>
        </Menu.Root>,
      );
      const item = screen.getByRole('menuitem', { name: '문서' });
      expect(item.tagName).toBe('A');
      await user.click(item);
      expect(onSelect).toHaveBeenCalled();
    });

    it('Root 밖에서 Menu 파트를 쓰면 에러를 던진다', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<Menu.Trigger>x</Menu.Trigger>)).toThrow('<Menu.Trigger>은(는) <Menu.Root> 안에서만 사용할 수 있습니다.');
      spy.mockRestore();
    });
  });

  describe('접근성 (axe)', () => {
    it('닫힌 상태에 위반이 없다', async () => {
      const { container } = render(<TestMenu />);
      expect(await axe(container)).toHaveNoViolations();
    });

    it('열린 상태에 위반이 없다', async () => {
      const user = userEvent.setup();
      render(<TestMenu />);
      await user.click(trigger());
      expect(await axe(document.body)).toHaveNoViolations();
    });

    it('체크박스·라디오 항목이 있는 열린 상태에 위반이 없다', async () => {
      render(
        <Menu.Root defaultOpen>
          <Menu.Trigger>옵션</Menu.Trigger>
          <Menu.Portal>
            <Menu.Content>
              <Menu.CheckboxItem defaultChecked>눈금자</Menu.CheckboxItem>
              <Menu.Separator />
              <Menu.RadioGroup aria-label="정렬 기준" defaultValue="name">
                <Menu.RadioItem value="name">이름</Menu.RadioItem>
                <Menu.RadioItem value="date">날짜</Menu.RadioItem>
              </Menu.RadioGroup>
            </Menu.Content>
          </Menu.Portal>
        </Menu.Root>,
      );
      expect(await axe(document.body)).toHaveNoViolations();
    });
  });
});
