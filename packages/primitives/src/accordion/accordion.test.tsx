import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { configureAxe } from 'vitest-axe';
import { Accordion, type AccordionRootProps } from './index';

const axe = configureAxe({ rules: { 'color-contrast': { enabled: false } } });

function TestAccordion(props: Partial<AccordionRootProps>) {
  return (
    <Accordion.Root {...props}>
      <Accordion.Item value="a">
        <Accordion.Header>
          <Accordion.Trigger>첫째</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content>첫째 내용</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="b" disabled>
        <Accordion.Header>
          <Accordion.Trigger>둘째</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content>둘째 내용</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="c">
        <Accordion.Header>
          <Accordion.Trigger>셋째</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content>셋째 내용</Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  );
}

const trigger = (name: string) => screen.getByRole('button', { name });

describe('Accordion', () => {
  describe('ARIA', () => {
    it('Header는 heading, Trigger는 aria-expanded를 가진다', () => {
      render(<TestAccordion defaultValue={['a']} />);
      expect(screen.getByRole('heading', { name: '첫째', level: 3 })).toBeInTheDocument();
      expect(trigger('첫째')).toHaveAttribute('aria-expanded', 'true');
      expect(trigger('셋째')).toHaveAttribute('aria-expanded', 'false');
    });

    it('열린 패널은 region이며 Trigger와 서로 연결된다', () => {
      render(<TestAccordion defaultValue={['a']} />);
      const region = screen.getByRole('region', { name: '첫째' });
      expect(region).toHaveTextContent('첫째 내용');
      expect(trigger('첫째')).toHaveAttribute('aria-controls', region.id);
      expect(trigger('셋째')).not.toHaveAttribute('aria-controls');
    });

    it('닫힌 패널은 렌더하지 않고, forceMount면 hidden으로 유지한다', () => {
      const { rerender } = render(<TestAccordion />);
      expect(screen.queryByText('첫째 내용')).not.toBeInTheDocument();

      rerender(
        <Accordion.Root>
          <Accordion.Item value="a">
            <Accordion.Header>
              <Accordion.Trigger>첫째</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content forceMount data-testid="panel">
              내용
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>,
      );
      expect(screen.getByTestId('panel')).toHaveAttribute('hidden');
    });

    it('data-state로 열림 여부를 노출한다', () => {
      render(<TestAccordion defaultValue={['a']} />);
      expect(trigger('첫째')).toHaveAttribute('data-state', 'open');
      expect(trigger('셋째')).toHaveAttribute('data-state', 'closed');
    });

    it('Root 밖에서 쓰면 에러를 던진다', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<Accordion.Item value="a">x</Accordion.Item>)).toThrow('<Accordion.Item>은(는) <Accordion.Root> 안에서만 사용할 수 있습니다.');
      expect(() => render(<Accordion.Trigger>x</Accordion.Trigger>)).toThrow('<Accordion.Trigger>은(는) <Accordion.Root> 안에서만 사용할 수 있습니다.');
      spy.mockRestore();
    });
  });

  describe('single', () => {
    it('다른 아이템을 열면 이전 아이템이 닫힌다', async () => {
      const user = userEvent.setup();
      render(<TestAccordion defaultValue={['a']} />);
      await user.click(trigger('셋째'));
      expect(trigger('셋째')).toHaveAttribute('aria-expanded', 'true');
      expect(trigger('첫째')).toHaveAttribute('aria-expanded', 'false');
    });

    it('collapsible이 아니면 열린 아이템을 닫을 수 없고 aria-disabled를 가진다', async () => {
      const user = userEvent.setup();
      render(<TestAccordion defaultValue={['a']} />);
      expect(trigger('첫째')).toHaveAttribute('aria-disabled', 'true');
      await user.click(trigger('첫째'));
      expect(trigger('첫째')).toHaveAttribute('aria-expanded', 'true');
    });

    it('collapsible이면 열린 아이템을 다시 눌러 닫는다', async () => {
      const user = userEvent.setup();
      render(<TestAccordion defaultValue={['a']} collapsible />);
      expect(trigger('첫째')).not.toHaveAttribute('aria-disabled');
      await user.click(trigger('첫째'));
      expect(trigger('첫째')).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('multiple', () => {
    it('여러 아이템을 동시에 열고 개별로 닫는다', async () => {
      const user = userEvent.setup();
      render(<TestAccordion type="multiple" />);
      await user.click(trigger('첫째'));
      await user.click(trigger('셋째'));
      expect(trigger('첫째')).toHaveAttribute('aria-expanded', 'true');
      expect(trigger('셋째')).toHaveAttribute('aria-expanded', 'true');

      await user.click(trigger('첫째'));
      expect(trigger('첫째')).toHaveAttribute('aria-expanded', 'false');
      expect(trigger('셋째')).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('제어 모드', () => {
    it('value / onValueChange로 제어한다', async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<TestAccordion value={['a']} onValueChange={onValueChange} />);
      await user.click(trigger('셋째'));
      expect(onValueChange).toHaveBeenCalledWith(['c']);
      // 부모가 값을 바꾸지 않았으므로 그대로다.
      expect(trigger('첫째')).toHaveAttribute('aria-expanded', 'true');
    });

    it('onClick에서 preventDefault()하면 토글하지 않는다', async () => {
      const user = userEvent.setup();
      render(
        <Accordion.Root>
          <Accordion.Item value="a">
            <Accordion.Header>
              <Accordion.Trigger onClick={(e) => e.preventDefault()}>첫째</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content>내용</Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>,
      );
      await user.click(trigger('첫째'));
      expect(trigger('첫째')).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('키보드 (APG)', () => {
    it('Enter / Space로 토글한다', async () => {
      const user = userEvent.setup();
      render(<TestAccordion type="multiple" />);
      trigger('첫째').focus();
      await user.keyboard('{Enter}');
      expect(trigger('첫째')).toHaveAttribute('aria-expanded', 'true');
      await user.keyboard(' ');
      expect(trigger('첫째')).toHaveAttribute('aria-expanded', 'false');
    });

    it('↓ / ↑ 로 비활성 아이템을 건너뛰며 순환 이동한다', async () => {
      const user = userEvent.setup();
      render(<TestAccordion />);
      trigger('첫째').focus();
      await user.keyboard('{ArrowDown}');
      expect(trigger('셋째')).toHaveFocus();
      await user.keyboard('{ArrowDown}');
      expect(trigger('첫째')).toHaveFocus();
      await user.keyboard('{ArrowUp}');
      expect(trigger('셋째')).toHaveFocus();
    });

    it('Home / End로 처음과 끝으로 이동한다', async () => {
      const user = userEvent.setup();
      render(<TestAccordion />);
      trigger('첫째').focus();
      await user.keyboard('{End}');
      expect(trigger('셋째')).toHaveFocus();
      await user.keyboard('{Home}');
      expect(trigger('첫째')).toHaveFocus();
    });

    it('Tab은 아이템 사이를 이동한다 (비활성 제외)', async () => {
      const user = userEvent.setup();
      render(<TestAccordion />);
      await user.tab();
      expect(trigger('첫째')).toHaveFocus();
      await user.tab();
      expect(trigger('셋째')).toHaveFocus();
    });
  });

  describe('비활성', () => {
    it('disabled 아이템은 열리지 않는다', async () => {
      const user = userEvent.setup();
      render(<TestAccordion />);
      await user.click(trigger('둘째'));
      expect(trigger('둘째')).toHaveAttribute('aria-expanded', 'false');
      expect(trigger('둘째')).toBeDisabled();
    });

    it('Root의 disabled는 모든 아이템에 적용된다', () => {
      render(<TestAccordion disabled />);
      expect(trigger('첫째')).toBeDisabled();
      expect(trigger('셋째')).toBeDisabled();
    });
  });

  describe('접근성 (axe)', () => {
    it('닫힌 상태와 열린 상태 모두 위반이 없다', async () => {
      const user = userEvent.setup();
      const { container } = render(<TestAccordion />);
      expect(await axe(container)).toHaveNoViolations();
      await user.click(trigger('첫째'));
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  it('Header를 asChild로 다른 제목 단계에 맞춘다', () => {
    render(
      <Accordion.Root>
        <Accordion.Item value="a">
          <Accordion.Header asChild>
            <h2>
              <Accordion.Trigger>제목</Accordion.Trigger>
            </h2>
          </Accordion.Header>
        </Accordion.Item>
      </Accordion.Root>,
    );
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('ref를 전달한다', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(
      <Accordion.Root>
        <Accordion.Item value="a">
          <Accordion.Header>
            <Accordion.Trigger ref={ref}>A</Accordion.Trigger>
          </Accordion.Header>
        </Accordion.Item>
      </Accordion.Root>,
    );
    expect(ref.current).toBe(trigger('A'));
  });
});
