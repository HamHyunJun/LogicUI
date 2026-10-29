import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { configureAxe } from 'vitest-axe';
import { RadioGroup, type RadioGroupRootProps } from './index';

const axe = configureAxe({ rules: { 'color-contrast': { enabled: false } } });

function TestGroup({ skipPro, ...props }: RadioGroupRootProps & { skipPro?: boolean }) {
  return (
    <>
      <button>앞</button>
      <RadioGroup.Root aria-label="요금제" {...props}>
        {[
          ['free', '무료'],
          ['pro', '프로'],
          ['team', '팀'],
        ].map(([value, label]) => (
          <RadioGroup.Item key={value} value={value!} disabled={skipPro && value === 'pro'}>
            <RadioGroup.Indicator data-testid={`ind-${value}`} />
            {label}
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
      <button>뒤</button>
    </>
  );
}

const radio = (name: string) => screen.getByRole('radio', { name });

describe('RadioGroup', () => {
  describe('ARIA', () => {
    it('radiogroup 안에 radio가 있고 선택된 항목만 aria-checked=true다', () => {
      render(<TestGroup defaultValue="pro" />);
      expect(screen.getByRole('radiogroup', { name: '요금제' })).toBeInTheDocument();
      expect(radio('무료')).toHaveAttribute('aria-checked', 'false');
      expect(radio('프로')).toHaveAttribute('aria-checked', 'true');
      expect(radio('프로')).toHaveAttribute('data-state', 'checked');
      expect(radio('팀')).toHaveAttribute('aria-checked', 'false');
    });

    it('Indicator는 선택된 항목에서만 렌더된다', () => {
      render(<TestGroup defaultValue="pro" />);
      expect(screen.getByTestId('ind-pro')).toBeInTheDocument();
      expect(screen.queryByTestId('ind-free')).not.toBeInTheDocument();
    });

    it('required, disabled, orientation을 노출한다', () => {
      render(<TestGroup required disabled orientation="horizontal" />);
      const group = screen.getByRole('radiogroup');
      expect(group).toHaveAttribute('aria-required', 'true');
      expect(group).toHaveAttribute('aria-disabled', 'true');
      expect(group).toHaveAttribute('data-orientation', 'horizontal');
      expect(radio('무료')).toBeDisabled();
    });
  });

  describe('로빙 tabindex', () => {
    it('선택된 항목만 tabindex=0이다', () => {
      render(<TestGroup defaultValue="pro" />);
      expect(radio('무료')).toHaveAttribute('tabindex', '-1');
      expect(radio('프로')).toHaveAttribute('tabindex', '0');
      expect(radio('팀')).toHaveAttribute('tabindex', '-1');
    });

    it('선택된 값이 없으면 첫 활성 항목이 tabindex=0이다', () => {
      render(<TestGroup />);
      expect(radio('무료')).toHaveAttribute('tabindex', '0');
      expect(radio('프로')).toHaveAttribute('tabindex', '-1');
    });

    it('Tab은 그룹에 한 번만 멈추고 선택된 항목으로 들어간다', async () => {
      const user = userEvent.setup();
      render(<TestGroup defaultValue="pro" />);
      await user.tab();
      expect(screen.getByRole('button', { name: '앞' })).toHaveFocus();
      await user.tab();
      expect(radio('프로')).toHaveFocus();
      await user.tab();
      expect(screen.getByRole('button', { name: '뒤' })).toHaveFocus();
      await user.tab({ shift: true });
      expect(radio('프로')).toHaveFocus();
    });
  });

  describe('키보드', () => {
    it('ArrowDown/ArrowRight는 다음 항목으로 포커스를 옮기며 선택하고 끝에서 순환한다', async () => {
      const user = userEvent.setup();
      render(<TestGroup defaultValue="free" />);
      radio('무료').focus();
      await user.keyboard('{ArrowDown}');
      expect(radio('프로')).toHaveFocus();
      expect(radio('프로')).toHaveAttribute('aria-checked', 'true');
      await user.keyboard('{ArrowRight}{ArrowRight}');
      expect(radio('무료')).toHaveFocus();
      expect(radio('무료')).toHaveAttribute('aria-checked', 'true');
    });

    it('ArrowUp/ArrowLeft는 이전 항목으로 옮기며 선택하고 처음에서 순환한다', async () => {
      const user = userEvent.setup();
      render(<TestGroup defaultValue="free" />);
      radio('무료').focus();
      await user.keyboard('{ArrowUp}');
      expect(radio('팀')).toHaveFocus();
      expect(radio('팀')).toHaveAttribute('aria-checked', 'true');
      await user.keyboard('{ArrowLeft}');
      expect(radio('프로')).toHaveFocus();
    });

    it('비활성 항목은 건너뛴다', async () => {
      const user = userEvent.setup();
      render(<TestGroup defaultValue="free" skipPro />);
      radio('무료').focus();
      await user.keyboard('{ArrowDown}');
      expect(radio('팀')).toHaveFocus();
    });

    it('Space로 포커스된 항목을 선택한다', async () => {
      const user = userEvent.setup();
      render(<TestGroup />);
      radio('무료').focus();
      await user.keyboard(' ');
      expect(radio('무료')).toHaveAttribute('aria-checked', 'true');
    });

    it('Enter로는 선택하지 않는다', async () => {
      const user = userEvent.setup();
      render(<TestGroup />);
      radio('무료').focus();
      await user.keyboard('{Enter}');
      expect(radio('무료')).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('제어·비제어', () => {
    it('클릭하면 선택되고 onValueChange를 호출한다', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<TestGroup onValueChange={onValueChange} />);
      await user.click(radio('팀'));
      expect(onValueChange).toHaveBeenCalledWith('team');
      expect(radio('팀')).toHaveAttribute('aria-checked', 'true');
    });

    it('이미 선택된 항목을 다시 눌러도 onValueChange를 호출하지 않는다', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<TestGroup defaultValue="team" onValueChange={onValueChange} />);
      await user.click(radio('팀'));
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('제어 모드에서는 value prop을 따른다', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const { rerender } = render(<TestGroup value="free" onValueChange={onValueChange} />);
      await user.click(radio('팀'));
      expect(onValueChange).toHaveBeenCalledWith('team');
      expect(radio('팀')).toHaveAttribute('aria-checked', 'false');
      rerender(<TestGroup value="team" onValueChange={onValueChange} />);
      expect(radio('팀')).toHaveAttribute('aria-checked', 'true');
    });

    it('onClick에서 preventDefault()하면 선택하지 않는다', async () => {
      const user = userEvent.setup();
      render(
        <RadioGroup.Root aria-label="x">
          <RadioGroup.Item value="a" onClick={(e) => e.preventDefault()}>
            A
          </RadioGroup.Item>
        </RadioGroup.Root>,
      );
      await user.click(screen.getByRole('radio', { name: 'A' }));
      expect(screen.getByRole('radio', { name: 'A' })).toHaveAttribute('aria-checked', 'false');
    });

    it('그룹이 disabled면 선택되지 않는다', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<TestGroup disabled onValueChange={onValueChange} />);
      await user.click(radio('무료'));
      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  describe('폼', () => {
    it('name이 있으면 선택된 항목의 값만 폼에 포함된다', async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <TestGroup name="plan" />
        </form>,
      );
      const form = screen.getByTestId('form') as HTMLFormElement;
      expect(new FormData(form).get('plan')).toBeNull();
      await user.click(radio('프로'));
      expect(new FormData(form).get('plan')).toBe('pro');
      await user.click(radio('팀'));
      expect(new FormData(form).getAll('plan')).toEqual(['team']);
    });
  });

  describe('에러', () => {
    it('Root 밖에서 Item을 쓰면 에러를 던진다', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<RadioGroup.Item value="a" />)).toThrow('<RadioGroup.Item>은(는) <RadioGroup.Root> 안에서만 사용할 수 있습니다.');
      spy.mockRestore();
    });

    it('Item 밖에서 Indicator를 쓰면 에러를 던진다', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<RadioGroup.Indicator />)).toThrow('<RadioGroup.Indicator>은(는) <RadioGroup.Item> 안에서만 사용할 수 있습니다.');
      spy.mockRestore();
    });
  });

  describe('접근성 (axe)', () => {
    it('선택 전과 후 모두 위반이 없다', async () => {
      const { container, rerender } = render(<TestGroup />);
      expect(await axe(container)).toHaveNoViolations();
      rerender(<TestGroup defaultValue="pro" value="pro" />);
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
