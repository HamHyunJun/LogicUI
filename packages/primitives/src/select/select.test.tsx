import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { configureAxe } from 'vitest-axe';
import { Select, type SelectContentProps, type SelectRootProps } from './index';

// 포털로 body에 붙는 목록은 테스트 문서에 landmark가 없어 region 규칙이 실패하므로 끈다.
const axe = configureAxe({ rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } });

function TestSelect({ contentProps, ...rootProps }: SelectRootProps & { contentProps?: SelectContentProps }) {
  return (
    <>
      <button>앞</button>
      <label id="fruit-label">과일</label>
      <Select.Root {...rootProps}>
        <Select.Trigger aria-labelledby="fruit-label">
          <Select.Value placeholder="선택하세요" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Content {...contentProps}>
            <Select.Item value="apple">Apple</Select.Item>
            <Select.Item value="banana">Banana</Select.Item>
            <Select.Item value="blueberry" disabled>
              Blueberry
            </Select.Item>
            <Select.Item value="cherry">Cherry</Select.Item>
            <Select.Item value="grape">Grape</Select.Item>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
      <button>바깥</button>
    </>
  );
}

const combo = () => screen.getByRole('combobox');
const option = (name: string) => screen.getByRole('option', { name });
const activeText = () => document.getElementById(combo().getAttribute('aria-activedescendant') ?? '')?.textContent;

describe('Select', () => {
  describe('ARIA', () => {
    it('Trigger는 role="combobox"이고 aria-haspopup="listbox"와 aria-expanded를 가진다', () => {
      render(<TestSelect />);
      expect(combo()).toHaveAttribute('aria-haspopup', 'listbox');
      expect(combo()).toHaveAttribute('aria-expanded', 'false');
      expect(combo()).not.toHaveAttribute('aria-controls');
      expect(combo()).toHaveAccessibleName('과일');
    });

    it('닫혀 있을 때 listbox는 숨겨져 있고 열리면 보이며 aria-controls로 연결된다', async () => {
      const user = userEvent.setup();
      render(<TestSelect />);
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      await user.click(combo());
      const listbox = screen.getByRole('listbox', { name: '과일' });
      expect(combo()).toHaveAttribute('aria-expanded', 'true');
      expect(combo()).toHaveAttribute('aria-controls', listbox.id);
    });

    it('옵션은 role="option"과 aria-selected, 비활성은 aria-disabled를 가진다', async () => {
      const user = userEvent.setup();
      render(<TestSelect defaultValue="banana" />);
      await user.click(combo());
      expect(option('Banana')).toHaveAttribute('aria-selected', 'true');
      expect(option('Banana')).toHaveAttribute('data-state', 'checked');
      expect(option('Apple')).toHaveAttribute('aria-selected', 'false');
      expect(option('Blueberry')).toHaveAttribute('aria-disabled', 'true');
    });

    it('열리면 aria-activedescendant가 가리키는 옵션이 data-highlighted를 가진다', async () => {
      const user = userEvent.setup();
      render(<TestSelect />);
      await user.click(combo());
      expect(activeText()).toBe('Apple');
      expect(option('Apple')).toHaveAttribute('data-highlighted');
    });

    it('목록의 이름은 트리거의 aria-label을 따르고, 둘 다 없으면 트리거를 가리킨다', async () => {
      const user = userEvent.setup();
      const { unmount } = render(
        <Select.Root>
          <Select.Trigger aria-label="나라">
            <Select.Value placeholder="선택" />
          </Select.Trigger>
          <Select.Portal>
            <Select.Content>
              <Select.Item value="kr">한국</Select.Item>
            </Select.Content>
          </Select.Portal>
        </Select.Root>,
      );
      await user.click(combo());
      expect(screen.getByRole('listbox', { name: '나라' })).toBeInTheDocument();
      unmount();
      render(
        <Select.Root defaultOpen>
          <Select.Trigger>
            <Select.Value placeholder="선택" />
          </Select.Trigger>
          <Select.Portal>
            <Select.Content>
              <Select.Item value="kr">한국</Select.Item>
            </Select.Content>
          </Select.Portal>
        </Select.Root>,
      );
      expect(screen.getByRole('listbox')).toHaveAttribute('aria-labelledby', combo().id);
    });

    it('required는 aria-required를 붙인다', () => {
      render(<TestSelect required />);
      expect(combo()).toHaveAttribute('aria-required', 'true');
    });
  });

  describe('Value', () => {
    it('선택된 값이 없으면 placeholder를, 있으면 닫혀 있어도 옵션의 라벨을 보여 준다', () => {
      const { rerender } = render(<TestSelect />);
      expect(combo()).toHaveTextContent('선택하세요');
      expect(combo()).toHaveAttribute('data-placeholder');
      rerender(<TestSelect defaultValue="cherry" value="cherry" />);
      expect(combo()).toHaveTextContent('Cherry');
      expect(combo()).not.toHaveAttribute('data-placeholder');
    });

    it('textValue가 있으면 그 라벨을 쓴다', () => {
      render(
        <Select.Root defaultValue="kr">
          <Select.Trigger aria-label="나라">
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Content>
              <Select.Item value="kr" textValue="대한민국">
                🇰🇷 대한민국 (KR)
              </Select.Item>
            </Select.Content>
          </Select.Portal>
        </Select.Root>,
      );
      expect(combo()).toHaveTextContent('대한민국');
      expect(combo()).not.toHaveTextContent('KR');
    });
  });

  describe('Trigger 키보드 (닫힘)', () => {
    it.each([['{Enter}'], [' '], ['{ArrowDown}']])('%s로 열고 첫 옵션을 가리킨다', async (keys) => {
      const user = userEvent.setup();
      render(<TestSelect />);
      combo().focus();
      await user.keyboard(keys);
      expect(combo()).toHaveAttribute('aria-expanded', 'true');
      expect(activeText()).toBe('Apple');
      expect(combo()).toHaveFocus(); // DOM 포커스는 트리거에 남는다
    });

    it('ArrowUp으로 열면 마지막 옵션을 가리킨다', async () => {
      const user = userEvent.setup();
      render(<TestSelect />);
      combo().focus();
      await user.keyboard('{ArrowUp}');
      expect(activeText()).toBe('Grape');
    });

    it('선택된 값이 있으면 열 때 그 옵션을 가리킨다', async () => {
      const user = userEvent.setup();
      render(<TestSelect defaultValue="cherry" />);
      combo().focus();
      await user.keyboard('{ArrowDown}');
      expect(activeText()).toBe('Cherry');
    });

    it('글자를 입력하면 열고 그 글자로 시작하는 옵션을 가리킨다', async () => {
      const user = userEvent.setup();
      render(<TestSelect />);
      combo().focus();
      await user.keyboard('c');
      expect(combo()).toHaveAttribute('aria-expanded', 'true');
      expect(activeText()).toBe('Cherry');
    });
  });

  describe('Trigger 키보드 (열림)', () => {
    async function openSelect() {
      const user = userEvent.setup();
      render(<TestSelect />);
      combo().focus();
      await user.keyboard('{ArrowDown}');
      return user;
    }

    it('ArrowDown/ArrowUp은 비활성 옵션을 건너뛰며 끝에서 멈춘다(순환하지 않음)', async () => {
      const user = await openSelect();
      await user.keyboard('{ArrowDown}');
      expect(activeText()).toBe('Banana');
      await user.keyboard('{ArrowDown}');
      expect(activeText()).toBe('Cherry'); // Blueberry 건너뜀
      await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
      expect(activeText()).toBe('Grape');
      await user.keyboard('{ArrowUp}');
      expect(activeText()).toBe('Cherry');
    });

    it('Home/End/PageDown/PageUp으로 이동한다', async () => {
      const user = await openSelect();
      await user.keyboard('{End}');
      expect(activeText()).toBe('Grape');
      await user.keyboard('{Home}');
      expect(activeText()).toBe('Apple');
      await user.keyboard('{PageDown}');
      expect(activeText()).toBe('Grape');
      await user.keyboard('{PageUp}');
      expect(activeText()).toBe('Apple');
    });

    it('Enter로 가리키는 옵션을 선택하고 닫는다', async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<TestSelect onValueChange={onValueChange} />);
      combo().focus();
      await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
      expect(onValueChange).toHaveBeenCalledWith('banana');
      expect(combo()).toHaveAttribute('aria-expanded', 'false');
      expect(combo()).toHaveTextContent('Banana');
      expect(combo()).toHaveFocus();
    });

    it('Space로 선택한다', async () => {
      const user = await openSelect();
      await user.keyboard('{ArrowDown} ');
      expect(combo()).toHaveTextContent('Banana');
      expect(combo()).toHaveAttribute('aria-expanded', 'false');
    });

    it('Alt+ArrowUp으로 선택하고 닫는다', async () => {
      const user = await openSelect();
      await user.keyboard('{ArrowDown}{Alt>}{ArrowUp}{/Alt}');
      expect(combo()).toHaveTextContent('Banana');
      expect(combo()).toHaveAttribute('aria-expanded', 'false');
    });

    it('Esc로 선택을 바꾸지 않고 닫는다', async () => {
      const user = await openSelect();
      await user.keyboard('{ArrowDown}{Escape}');
      expect(combo()).toHaveAttribute('aria-expanded', 'false');
      expect(combo()).toHaveTextContent('선택하세요');
      expect(combo()).toHaveFocus();
    });

    it('Tab은 가리키는 옵션을 선택하고 닫으며 포커스를 다음 요소로 보낸다', async () => {
      const user = await openSelect();
      await user.keyboard('{ArrowDown}{Tab}');
      expect(combo()).toHaveTextContent('Banana');
      expect(combo()).toHaveAttribute('aria-expanded', 'false');
      expect(screen.getByRole('button', { name: '바깥' })).toHaveFocus();
    });

    it('글자 입력으로 이동하고, 같은 글자를 반복하면 순환하며, 여러 글자는 접두사로 찾는다', async () => {
      const user = await openSelect();
      await user.keyboard('b');
      expect(activeText()).toBe('Banana');
      await user.keyboard('b'); // 같은 글자 반복: 다음 b 옵션(비활성 Blueberry는 제외)
      expect(activeText()).toBe('Banana');
    });

    it('여러 글자를 이어서 입력하면 접두사가 일치하는 옵션으로 간다', async () => {
      const user = await openSelect();
      await user.keyboard('gr');
      expect(activeText()).toBe('Grape');
    });
  });

  describe('포인터', () => {
    it('Trigger를 누르면 열리고 다시 누르면 닫힌다', async () => {
      const user = userEvent.setup();
      render(<TestSelect />);
      await user.click(combo());
      expect(combo()).toHaveAttribute('aria-expanded', 'true');
      await user.click(combo());
      expect(combo()).toHaveAttribute('aria-expanded', 'false');
    });

    it('옵션을 누르면 선택되고 닫히며 포커스는 트리거에 남는다', async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<TestSelect onValueChange={onValueChange} />);
      await user.click(combo());
      await user.click(option('Cherry'));
      expect(onValueChange).toHaveBeenCalledWith('cherry');
      expect(combo()).toHaveTextContent('Cherry');
      expect(combo()).toHaveAttribute('aria-expanded', 'false');
      expect(combo()).toHaveFocus();
    });

    it('비활성 옵션은 눌러도 선택되지 않는다', async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<TestSelect onValueChange={onValueChange} />);
      await user.click(combo());
      await user.click(option('Blueberry'));
      expect(onValueChange).not.toHaveBeenCalled();
      expect(combo()).toHaveAttribute('aria-expanded', 'true');
    });

    it('마우스를 올린 옵션을 가리킨다', async () => {
      const user = userEvent.setup();
      render(<TestSelect />);
      await user.click(combo());
      await user.hover(option('Cherry'));
      expect(activeText()).toBe('Cherry');
    });

    it('바깥을 누르면 선택을 바꾸지 않고 닫힌다', async () => {
      const user = userEvent.setup();
      render(<TestSelect />);
      await user.click(combo());
      await user.click(screen.getByRole('button', { name: '바깥' }));
      expect(combo()).toHaveAttribute('aria-expanded', 'false');
      expect(combo()).toHaveTextContent('선택하세요');
    });
  });

  describe('제어·비제어와 취소', () => {
    it('제어 모드에서는 value prop을 따른다', async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      const { rerender } = render(<TestSelect value="apple" onValueChange={onValueChange} />);
      await user.click(combo());
      await user.click(option('Cherry'));
      expect(onValueChange).toHaveBeenCalledWith('cherry');
      expect(combo()).toHaveTextContent('Apple');
      rerender(<TestSelect value="cherry" onValueChange={onValueChange} />);
      expect(combo()).toHaveTextContent('Cherry');
    });

    it('제어 모드에서는 open prop을 따르고 onOpenChange를 호출한다', async () => {
      const onOpenChange = vi.fn();
      const user = userEvent.setup();
      render(<TestSelect open={false} onOpenChange={onOpenChange} />);
      await user.click(combo());
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(combo()).toHaveAttribute('aria-expanded', 'false');
    });

    it('defaultOpen이면 처음부터 열려 있다', () => {
      render(<TestSelect defaultOpen />);
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(activeText()).toBe('Apple');
    });

    it('onEscapeKeyDown에서 preventDefault()하면 Esc로 닫히지 않는다', async () => {
      const user = userEvent.setup();
      render(<TestSelect contentProps={{ onEscapeKeyDown: (e) => e.preventDefault() }} />);
      combo().focus();
      await user.keyboard('{ArrowDown}{Escape}');
      expect(combo()).toHaveAttribute('aria-expanded', 'true');
    });

    it('onPointerDownOutside에서 preventDefault()하면 바깥을 눌러도 닫히지 않는다', async () => {
      const user = userEvent.setup();
      render(<TestSelect contentProps={{ onPointerDownOutside: (e) => e.preventDefault() }} />);
      await user.click(combo());
      await user.click(screen.getByRole('button', { name: '바깥' }));
      expect(combo()).toHaveAttribute('aria-expanded', 'true');
    });

    it('disabled면 열리지 않는다', async () => {
      const user = userEvent.setup();
      render(<TestSelect disabled />);
      expect(combo()).toBeDisabled();
      await user.click(combo());
      expect(combo()).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('폼과 에러', () => {
    it('name이 있으면 선택된 값이 폼에 제출된다', async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <TestSelect name="fruit" />
        </form>,
      );
      const form = screen.getByTestId('form') as HTMLFormElement;
      expect(new FormData(form).get('fruit')).toBe('');
      await user.click(combo());
      await user.click(option('Grape'));
      expect(new FormData(form).get('fruit')).toBe('grape');
    });

    it('Root 밖에서 Trigger를 쓰면 에러를 던진다', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<Select.Trigger />)).toThrow('<Select.Trigger>은(는) <Select.Root> 안에서만 사용할 수 있습니다.');
      spy.mockRestore();
    });
  });

  describe('접근성 (axe)', () => {
    it('닫힌 상태와 열린 상태 모두 위반이 없다', async () => {
      const user = userEvent.setup();
      const { container } = render(<TestSelect />);
      expect(await axe(container)).toHaveNoViolations();
      await user.click(combo());
      expect(await axe(document.body)).toHaveNoViolations();
    });
  });
});
