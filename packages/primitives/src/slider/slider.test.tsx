import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { configureAxe } from 'vitest-axe';
import { Slider, type SliderRootProps } from './index';

const axe = configureAxe({ rules: { 'color-contrast': { enabled: false } } });

function TestSlider(props: SliderRootProps) {
  return (
    <Slider.Root data-testid="root" {...props}>
      <Slider.Track>
        <Slider.Range data-testid="range" />
      </Slider.Track>
      <Slider.Thumb aria-label="볼륨" />
    </Slider.Root>
  );
}

const thumb = () => screen.getByRole('slider', { name: '볼륨' });

/** jsdom은 레이아웃이 없어 포인터 위치 계산에 쓸 크기를 직접 정해 준다. */
const mockRect = (el: HTMLElement, rect: { width: number; height: number }) =>
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    right: rect.width,
    bottom: rect.height,
    width: rect.width,
    height: rect.height,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });

const pointerDown = (el: HTMLElement, init: PointerEventInit) => fireEvent.pointerDown(el, { button: 0, ...init });

describe('Slider', () => {
  describe('ARIA', () => {
    it('role="slider"와 aria-valuemin/max/now/orientation을 가진다', () => {
      render(<TestSlider defaultValue={30} />);
      expect(thumb()).toHaveAttribute('aria-valuemin', '0');
      expect(thumb()).toHaveAttribute('aria-valuemax', '100');
      expect(thumb()).toHaveAttribute('aria-valuenow', '30');
      expect(thumb()).toHaveAttribute('aria-orientation', 'horizontal');
      expect(thumb()).toHaveAttribute('tabindex', '0');
    });

    it('defaultValue가 없으면 min에서 시작한다', () => {
      render(<TestSlider min={10} max={50} />);
      expect(thumb()).toHaveAttribute('aria-valuenow', '10');
    });

    it('범위를 벗어난 값은 min·max로 보정한다', () => {
      render(<TestSlider value={500} />);
      expect(thumb()).toHaveAttribute('aria-valuenow', '100');
    });

    it('현재 비율을 CSS 변수로 노출한다', () => {
      render(<TestSlider defaultValue={25} />);
      expect(screen.getByTestId('root').style.getPropertyValue('--logicui-slider-percent')).toBe('25%');
    });

    it('disabled면 포커스를 받지 않고 data-disabled·aria-disabled가 붙는다', () => {
      render(<TestSlider disabled />);
      expect(thumb()).not.toHaveAttribute('tabindex');
      expect(thumb()).toHaveAttribute('aria-disabled', 'true');
      expect(screen.getByTestId('range')).toHaveAttribute('data-disabled');
    });
  });

  describe('키보드', () => {
    it('→/↑는 step만큼 증가하고 ←/↓는 감소한다', async () => {
      const user = userEvent.setup();
      render(<TestSlider defaultValue={50} step={5} />);
      thumb().focus();
      await user.keyboard('{ArrowRight}');
      expect(thumb()).toHaveAttribute('aria-valuenow', '55');
      await user.keyboard('{ArrowUp}');
      expect(thumb()).toHaveAttribute('aria-valuenow', '60');
      await user.keyboard('{ArrowLeft}{ArrowDown}{ArrowDown}');
      expect(thumb()).toHaveAttribute('aria-valuenow', '45');
    });

    it('PageUp/PageDown은 step의 10배씩 움직인다', async () => {
      const user = userEvent.setup();
      render(<TestSlider defaultValue={50} />);
      thumb().focus();
      await user.keyboard('{PageUp}');
      expect(thumb()).toHaveAttribute('aria-valuenow', '60');
      await user.keyboard('{PageDown}{PageDown}');
      expect(thumb()).toHaveAttribute('aria-valuenow', '40');
    });

    it('Home/End는 min/max로 이동한다', async () => {
      const user = userEvent.setup();
      render(<TestSlider defaultValue={50} min={10} max={90} />);
      thumb().focus();
      await user.keyboard('{End}');
      expect(thumb()).toHaveAttribute('aria-valuenow', '90');
      await user.keyboard('{Home}');
      expect(thumb()).toHaveAttribute('aria-valuenow', '10');
    });

    it('min·max를 넘어서 움직이지 않는다', async () => {
      const user = userEvent.setup();
      render(<TestSlider defaultValue={99} />);
      thumb().focus();
      await user.keyboard('{ArrowRight}{ArrowRight}{PageUp}');
      expect(thumb()).toHaveAttribute('aria-valuenow', '100');
    });

    it('소수 step의 부동소수점 오차를 걷어 낸다', async () => {
      const user = userEvent.setup();
      render(<TestSlider defaultValue={0} step={0.1} max={1} />);
      thumb().focus();
      await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
      expect(thumb()).toHaveAttribute('aria-valuenow', '0.3');
    });

    it('disabled면 키보드로 바뀌지 않는다', async () => {
      const user = userEvent.setup();
      render(<TestSlider defaultValue={50} disabled />);
      thumb().focus();
      fireEvent.keyDown(thumb(), { key: 'ArrowRight' });
      expect(thumb()).toHaveAttribute('aria-valuenow', '50');
      await user.keyboard('{End}');
      expect(thumb()).toHaveAttribute('aria-valuenow', '50');
    });

    it('onKeyDown에서 preventDefault()하면 내부 처리를 건너뛴다', async () => {
      const user = userEvent.setup();
      render(
        <Slider.Root defaultValue={50}>
          <Slider.Thumb aria-label="볼륨" onKeyDown={(e) => e.preventDefault()} />
        </Slider.Root>,
      );
      thumb().focus();
      await user.keyboard('{ArrowRight}');
      expect(thumb()).toHaveAttribute('aria-valuenow', '50');
    });
  });

  describe('제어·비제어와 콜백', () => {
    it('값이 바뀔 때만 onValueChange를, 키를 누를 때마다 onValueCommit을 호출한다', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const onValueCommit = vi.fn();
      render(<TestSlider defaultValue={99} onValueChange={onValueChange} onValueCommit={onValueCommit} />);
      thumb().focus();
      await user.keyboard('{ArrowRight}');
      expect(onValueChange).toHaveBeenLastCalledWith(100);
      expect(onValueCommit).toHaveBeenLastCalledWith(100);
      await user.keyboard('{ArrowRight}'); // 이미 max라 값은 그대로
      expect(onValueChange).toHaveBeenCalledTimes(1);
    });

    it('제어 모드에서는 value prop을 따른다', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const { rerender } = render(<TestSlider value={40} onValueChange={onValueChange} />);
      thumb().focus();
      await user.keyboard('{ArrowRight}');
      expect(onValueChange).toHaveBeenCalledWith(41);
      expect(thumb()).toHaveAttribute('aria-valuenow', '40');
      rerender(<TestSlider value={41} onValueChange={onValueChange} />);
      expect(thumb()).toHaveAttribute('aria-valuenow', '41');
    });
  });

  describe('포인터', () => {
    it('트랙을 누르면 그 위치의 값으로 이동하고 썸에 포커스한다', () => {
      render(<TestSlider defaultValue={0} />);
      mockRect(screen.getByTestId('root'), { width: 200, height: 20 });
      pointerDown(screen.getByTestId('root'), { clientX: 50, clientY: 10 });
      expect(thumb()).toHaveAttribute('aria-valuenow', '25');
      expect(thumb()).toHaveFocus();
    });

    it('드래그하면 값이 따라가고 놓을 때 onValueCommit을 한 번 호출한다', () => {
      const onValueCommit = vi.fn();
      render(<TestSlider defaultValue={0} onValueCommit={onValueCommit} />);
      mockRect(screen.getByTestId('root'), { width: 200, height: 20 });
      pointerDown(screen.getByTestId('root'), { clientX: 20, clientY: 10 });
      fireEvent.pointerMove(document, { clientX: 100, clientY: 10 });
      expect(thumb()).toHaveAttribute('aria-valuenow', '50');
      fireEvent.pointerMove(document, { clientX: 1000, clientY: 10 }); // 범위를 넘어도 max
      expect(thumb()).toHaveAttribute('aria-valuenow', '100');
      expect(onValueCommit).not.toHaveBeenCalled();
      fireEvent.pointerUp(document, { clientX: 1000, clientY: 10 });
      expect(onValueCommit).toHaveBeenCalledTimes(1);
      expect(onValueCommit).toHaveBeenCalledWith(100);
      // 놓은 뒤에는 움직여도 따라가지 않는다
      fireEvent.pointerMove(document, { clientX: 0, clientY: 10 });
      expect(thumb()).toHaveAttribute('aria-valuenow', '100');
    });

    it('step 단위로 맞춘다', () => {
      render(<TestSlider defaultValue={0} step={10} />);
      mockRect(screen.getByTestId('root'), { width: 200, height: 20 });
      pointerDown(screen.getByTestId('root'), { clientX: 62, clientY: 10 }); // 31% → 30
      expect(thumb()).toHaveAttribute('aria-valuenow', '30');
    });

    it('수직 슬라이더는 아래가 min, 위가 max다', () => {
      render(<TestSlider defaultValue={0} orientation="vertical" />);
      mockRect(screen.getByTestId('root'), { width: 20, height: 200 });
      pointerDown(screen.getByTestId('root'), { clientX: 10, clientY: 50 }); // 위에서 50px → 75%
      expect(thumb()).toHaveAttribute('aria-valuenow', '75');
      expect(thumb()).toHaveAttribute('aria-orientation', 'vertical');
    });

    it('disabled면 눌러도 바뀌지 않는다', () => {
      render(<TestSlider defaultValue={10} disabled />);
      mockRect(screen.getByTestId('root'), { width: 200, height: 20 });
      pointerDown(screen.getByTestId('root'), { clientX: 150, clientY: 10 });
      expect(thumb()).toHaveAttribute('aria-valuenow', '10');
    });

    it('마우스 왼쪽 버튼이 아니면 무시한다', () => {
      render(<TestSlider defaultValue={10} />);
      mockRect(screen.getByTestId('root'), { width: 200, height: 20 });
      pointerDown(screen.getByTestId('root'), { clientX: 150, clientY: 10, button: 2 });
      expect(thumb()).toHaveAttribute('aria-valuenow', '10');
    });

    it('드래그 중 언마운트해도 문서 리스너가 남지 않는다', () => {
      const { unmount } = render(<TestSlider defaultValue={0} />);
      mockRect(screen.getByTestId('root'), { width: 200, height: 20 });
      const remove = vi.spyOn(document, 'removeEventListener');
      pointerDown(screen.getByTestId('root'), { clientX: 20, clientY: 10 });
      unmount();
      expect(remove).toHaveBeenCalledWith('pointermove', expect.any(Function));
      remove.mockRestore();
    });
  });

  describe('폼과 에러', () => {
    it('name이 있으면 현재 값을 폼에 제출한다', async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <TestSlider name="volume" defaultValue={20} />
        </form>,
      );
      const form = screen.getByTestId('form') as HTMLFormElement;
      expect(new FormData(form).get('volume')).toBe('20');
      thumb().focus();
      await user.keyboard('{ArrowRight}');
      expect(new FormData(form).get('volume')).toBe('21');
    });

    it('Root 밖에서 Thumb을 쓰면 에러를 던진다', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<Slider.Thumb />)).toThrow('<Slider.Thumb>은(는) <Slider.Root> 안에서만 사용할 수 있습니다.');
      spy.mockRestore();
    });
  });

  describe('접근성 (axe)', () => {
    it('위반이 없다', async () => {
      const { container } = render(<TestSlider defaultValue={30} />);
      expect(await axe(container)).toHaveNoViolations();
    });

    it('수직·비활성에서도 위반이 없다', async () => {
      const { container } = render(<TestSlider defaultValue={30} orientation="vertical" disabled />);
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
