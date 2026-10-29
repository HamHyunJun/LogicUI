import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { configureAxe } from 'vitest-axe';
import { Combobox, type ComboboxContentProps, type ComboboxRootProps } from './index';

// 포털로 body에 붙는 목록은 테스트 문서에 landmark가 없어 region 규칙이 실패하므로 끈다.
const axe = configureAxe({ rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } });

const FRUITS = ['Apple', 'Apricot', 'Banana', 'Blueberry', 'Cherry', 'Grape'];

/** 입력 텍스트로 옵션을 거르는 일은 소비자가 한다. */
function TestCombobox({
  contentProps,
  onSubmit,
  ...rootProps
}: ComboboxRootProps & { contentProps?: ComboboxContentProps; onSubmit?: (e: React.FormEvent) => void }) {
  const [text, setText] = React.useState(rootProps.defaultInputValue ?? '');
  const matches = FRUITS.filter((f) => f.toLowerCase().startsWith(text.toLowerCase()));
  return (
    <form onSubmit={onSubmit ?? ((e) => e.preventDefault())} data-testid="form">
      <label htmlFor="fruit">과일</label>
      <Combobox.Root {...rootProps} onInputValueChange={(v) => { setText(v); rootProps.onInputValueChange?.(v); }}>
        <Combobox.Input id="fruit" />
        <Combobox.Portal>
          <Combobox.Content {...contentProps}>
            {matches.map((f) => (
              <Combobox.Item key={f} value={f.toLowerCase()} disabled={f === 'Blueberry'}>
                {f}
              </Combobox.Item>
            ))}
            {matches.length === 0 && <div>결과 없음</div>}
          </Combobox.Content>
        </Combobox.Portal>
      </Combobox.Root>
      <button type="button">바깥</button>
    </form>
  );
}

const input = () => screen.getByRole('combobox', { name: '과일' }) as HTMLInputElement;
const option = (name: string) => screen.getByRole('option', { name });
const activeText = () => document.getElementById(input().getAttribute('aria-activedescendant') ?? '')?.textContent;

describe('Combobox', () => {
  describe('ARIA', () => {
    it('입력창은 role="combobox", aria-autocomplete="list", aria-expanded를 가진다', () => {
      render(<TestCombobox />);
      expect(input()).toHaveAttribute('aria-autocomplete', 'list');
      expect(input()).toHaveAttribute('aria-haspopup', 'listbox');
      expect(input()).toHaveAttribute('aria-expanded', 'false');
      expect(input()).toHaveAttribute('autocomplete', 'off');
      expect(input()).not.toHaveAttribute('aria-controls');
    });

    it('열리면 listbox가 aria-controls로 연결되고 옵션은 aria-selected를 가진다', async () => {
      const user = userEvent.setup();
      render(<TestCombobox defaultValue="cherry" />);
      await user.type(input(), 'c');
      const listbox = screen.getByRole('listbox');
      expect(input()).toHaveAttribute('aria-expanded', 'true');
      expect(input()).toHaveAttribute('aria-controls', listbox.id);
      expect(option('Cherry')).toHaveAttribute('aria-selected', 'true');
      expect(option('Cherry')).toHaveAttribute('data-state', 'checked');
    });

    it('비활성 옵션은 aria-disabled를 가진다', async () => {
      const user = userEvent.setup();
      render(<TestCombobox />);
      await user.type(input(), 'b');
      expect(option('Blueberry')).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('입력', () => {
    it('타이핑하면 열리고 onInputValueChange를 호출하며 아무 옵션도 가리키지 않는다', async () => {
      const user = userEvent.setup();
      const onInputValueChange = vi.fn();
      render(<TestCombobox onInputValueChange={onInputValueChange} />);
      await user.type(input(), 'ap');
      expect(onInputValueChange).toHaveBeenLastCalledWith('ap');
      expect(input()).toHaveAttribute('aria-expanded', 'true');
      expect(input()).not.toHaveAttribute('aria-activedescendant');
      expect(screen.getAllByRole('option').map((el) => el.textContent)).toEqual(['Apple', 'Apricot']);
    });

    it('일치하는 옵션이 없으면 소비자가 렌더한 안내가 보인다', async () => {
      const user = userEvent.setup();
      render(<TestCombobox />);
      await user.type(input(), 'zzz');
      expect(screen.getByText('결과 없음')).toBeInTheDocument();
      expect(screen.queryAllByRole('option')).toHaveLength(0);
    });

    it('입력을 바꾸면 가리키던 옵션이 풀린다', async () => {
      const user = userEvent.setup();
      render(<TestCombobox />);
      await user.type(input(), 'a');
      await user.keyboard('{ArrowDown}');
      expect(activeText()).toBe('Apple');
      await user.keyboard('p');
      expect(input()).not.toHaveAttribute('aria-activedescendant');
    });
  });

  describe('키보드', () => {
    it('닫혀 있을 때 ↓는 열고 첫 옵션을, ↑는 열고 마지막 옵션을 가리킨다', async () => {
      const user = userEvent.setup();
      const { unmount } = render(<TestCombobox />);
      input().focus();
      await user.keyboard('{ArrowDown}');
      expect(activeText()).toBe('Apple');
      unmount();
      render(<TestCombobox />);
      input().focus();
      await user.keyboard('{ArrowUp}');
      expect(activeText()).toBe('Grape');
    });

    it('Alt+↓는 옵션을 가리키지 않고 열기만 한다', async () => {
      const user = userEvent.setup();
      render(<TestCombobox />);
      input().focus();
      await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
      expect(input()).toHaveAttribute('aria-expanded', 'true');
      expect(input()).not.toHaveAttribute('aria-activedescendant');
    });

    it('Alt+↑는 닫는다', async () => {
      const user = userEvent.setup();
      render(<TestCombobox />);
      input().focus();
      await user.keyboard('{ArrowDown}{Alt>}{ArrowUp}{/Alt}');
      expect(input()).toHaveAttribute('aria-expanded', 'false');
    });

    it('↓/↑는 비활성 옵션을 건너뛰며 끝에서 멈춘다', async () => {
      const user = userEvent.setup();
      render(<TestCombobox />);
      input().focus();
      await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
      expect(activeText()).toBe('Banana');
      await user.keyboard('{ArrowDown}');
      expect(activeText()).toBe('Cherry'); // Blueberry 건너뜀
      await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
      expect(activeText()).toBe('Grape');
      await user.keyboard('{ArrowUp}');
      expect(activeText()).toBe('Cherry');
    });

    it('옵션을 가리킨 채 Enter를 누르면 선택하고 입력창을 라벨로 채우며 닫는다', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<TestCombobox onValueChange={onValueChange} />);
      await user.type(input(), 'ap');
      await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
      expect(onValueChange).toHaveBeenCalledWith('apricot');
      expect(input()).toHaveValue('Apricot');
      expect(input()).toHaveAttribute('aria-expanded', 'false');
      expect(input()).toHaveFocus();
    });

    it('옵션을 가리키지 않으면 Enter는 폼 제출을 막지 않는다', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
      render(<TestCombobox onSubmit={onSubmit} />);
      await user.type(input(), 'ap{Enter}');
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('옵션을 선택하는 Enter는 폼을 제출하지 않는다', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
      render(<TestCombobox onSubmit={onSubmit} />);
      await user.type(input(), 'ap');
      await user.keyboard('{ArrowDown}{Enter}');
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('Esc는 선택하지 않고 닫는다', async () => {
      const user = userEvent.setup();
      render(<TestCombobox />);
      await user.type(input(), 'ap');
      await user.keyboard('{ArrowDown}{Escape}');
      expect(input()).toHaveAttribute('aria-expanded', 'false');
      expect(input()).toHaveValue('ap');
      expect(input()).toHaveFocus();
    });

    it('Tab은 선택하지 않고 닫으며 포커스를 다음으로 보낸다', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<TestCombobox onValueChange={onValueChange} />);
      await user.type(input(), 'ap');
      await user.keyboard('{ArrowDown}{Tab}');
      expect(onValueChange).not.toHaveBeenCalled();
      expect(input()).toHaveAttribute('aria-expanded', 'false');
      expect(input()).toHaveValue('ap');
      expect(screen.getByRole('button', { name: '바깥' })).toHaveFocus();
    });

    it('Home/End는 가로채지 않고 입력창 안에서 커서를 움직이게 둔다', async () => {
      const user = userEvent.setup();
      render(<TestCombobox />);
      await user.type(input(), 'ap');
      await user.keyboard('{ArrowDown}{Home}{End}');
      expect(activeText()).toBe('Apple');
    });
  });

  describe('포인터', () => {
    it('옵션을 누르면 선택되고 포커스는 입력창에 남는다', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<TestCombobox onValueChange={onValueChange} />);
      await user.type(input(), 'ch');
      await user.click(option('Cherry'));
      expect(onValueChange).toHaveBeenCalledWith('cherry');
      expect(input()).toHaveValue('Cherry');
      expect(input()).toHaveAttribute('aria-expanded', 'false');
      expect(input()).toHaveFocus();
    });

    it('비활성 옵션은 눌러도 선택되지 않는다', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<TestCombobox onValueChange={onValueChange} />);
      await user.type(input(), 'blue');
      await user.click(option('Blueberry'));
      expect(onValueChange).not.toHaveBeenCalled();
      expect(input()).toHaveAttribute('aria-expanded', 'true');
    });

    it('마우스를 올린 옵션을 가리킨다', async () => {
      const user = userEvent.setup();
      render(<TestCombobox />);
      await user.type(input(), 'a');
      await user.hover(option('Apricot'));
      expect(activeText()).toBe('Apricot');
    });

    it('바깥을 누르면 닫히고 포커스가 떠나면(blur) 닫힌다', async () => {
      const user = userEvent.setup();
      render(<TestCombobox />);
      await user.type(input(), 'a');
      await user.click(screen.getByRole('button', { name: '바깥' }));
      expect(input()).toHaveAttribute('aria-expanded', 'false');

      await user.type(input(), 'p');
      expect(input()).toHaveAttribute('aria-expanded', 'true');
      fireEvent.blur(input());
      expect(input()).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('제어·비제어와 취소', () => {
    it('제어 모드에서는 value·inputValue·open을 따른다', async () => {
      const user = userEvent.setup();
      const onInputValueChange = vi.fn();
      const onOpenChange = vi.fn();
      render(
        <Combobox.Root value="apple" inputValue="App" onInputValueChange={onInputValueChange} open={false} onOpenChange={onOpenChange}>
          <Combobox.Input aria-label="과일" />
          <Combobox.Portal>
            <Combobox.Content>
              <Combobox.Item value="apple">Apple</Combobox.Item>
            </Combobox.Content>
          </Combobox.Portal>
        </Combobox.Root>,
      );
      const box = screen.getByRole('combobox', { name: '과일' });
      expect(box).toHaveValue('App');
      await user.type(box, 'l');
      expect(onInputValueChange).toHaveBeenCalledWith('Appl');
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(box).toHaveValue('App'); // 제어 값은 그대로
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('defaultInputValue와 defaultOpen을 지원한다', () => {
      render(<TestCombobox defaultInputValue="gr" defaultOpen />);
      expect(input()).toHaveValue('gr');
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('onEscapeKeyDown에서 preventDefault()하면 Esc로 닫히지 않는다', async () => {
      const user = userEvent.setup();
      render(<TestCombobox contentProps={{ onEscapeKeyDown: (e) => e.preventDefault() }} />);
      await user.type(input(), 'a');
      await user.keyboard('{Escape}');
      expect(input()).toHaveAttribute('aria-expanded', 'true');
    });

    it('onPointerDownOutside에서 preventDefault()하면 바깥을 눌러도 닫히지 않는다', async () => {
      const user = userEvent.setup();
      render(<TestCombobox contentProps={{ onPointerDownOutside: (e) => e.preventDefault() }} />);
      await user.type(input(), 'a');
      fireEvent.pointerDown(screen.getByRole('button', { name: '바깥' }));
      expect(input()).toHaveAttribute('aria-expanded', 'true');
    });

    it('disabled면 입력도 열기도 되지 않는다', async () => {
      const user = userEvent.setup();
      render(<TestCombobox disabled />);
      expect(input()).toBeDisabled();
      await user.type(input(), 'a');
      expect(input()).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('폼과 에러', () => {
    it('name이 있으면 입력 텍스트가 아니라 선택된 값이 제출된다', async () => {
      const user = userEvent.setup();
      render(<TestCombobox name="fruit" />);
      const form = screen.getByTestId('form') as HTMLFormElement;
      expect(new FormData(form).get('fruit')).toBe('');
      await user.type(input(), 'gr');
      await user.click(option('Grape'));
      expect(new FormData(form).get('fruit')).toBe('grape');
    });

    it('Root 밖에서 Input을 쓰면 에러를 던진다', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<Combobox.Input />)).toThrow('<Combobox.Input>은(는) <Combobox.Root> 안에서만 사용할 수 있습니다.');
      spy.mockRestore();
    });
  });

  describe('접근성 (axe)', () => {
    it('닫힌 상태와 열린 상태 모두 위반이 없다', async () => {
      const user = userEvent.setup();
      const { container } = render(<TestCombobox />);
      expect(await axe(container)).toHaveNoViolations();
      await user.type(input(), 'a');
      await user.keyboard('{ArrowDown}');
      expect(await axe(document.body)).toHaveNoViolations();
    });
  });
});
