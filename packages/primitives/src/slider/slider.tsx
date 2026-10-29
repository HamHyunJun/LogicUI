import * as React from 'react';
import { composeEventHandlers } from '../shared/compose-event-handlers';
import { useComposedRefs } from '../shared/compose-refs';
import { focus } from '../shared/dom';
import { getComp, type AsChildProps } from '../shared/primitive';
import { useControllableState } from '../shared/use-controllable-state';

/*
 * WAI-ARIA APG Slider(단일 썸) 패턴.
 * shortcut: 썸이 하나인 슬라이더만 지원한다(범위 선택은 불가), 필요해지면 value를 배열로 확장한다.
 * shortcut: 오른쪽에서 왼쪽으로 쓰는 언어(RTL)의 방향 반전은 다루지 않는다.
 */

type Orientation = 'horizontal' | 'vertical';

/* -------------------------------------------------------------------------------------------------
 * 값 계산
 * -----------------------------------------------------------------------------------------------*/

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const decimalsOf = (n: number): number => String(n).split('.')[1]?.length ?? 0;

/** step 단위로 맞추고 부동소수점 오차를 걷어 낸다. */
const snap = (raw: number, min: number, max: number, step: number): number => {
  const steps = Math.round((raw - min) / step);
  const digits = Math.max(decimalsOf(step), decimalsOf(min));
  return clamp(Number((min + steps * step).toFixed(digits)), min, max);
};

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/

interface SliderContextValue {
  value: number;
  min: number;
  max: number;
  step: number;
  orientation: Orientation;
  disabled: boolean;
  /** step·범위에 맞춰 값을 설정하고, 실제로 설정한 값을 돌려준다. */
  setValue: (value: number) => number;
  /** 값을 확정했음을 알린다. 값을 넘기지 않으면 현재 값을 쓴다(포인터를 뗄 때). */
  commit: (value?: number) => void;
  thumbRef: React.RefObject<HTMLSpanElement | null>;
}

const SliderContext = React.createContext<SliderContextValue | null>(null);

function useSliderContext(part: string): SliderContextValue {
  const context = React.useContext(SliderContext);
  if (!context) {
    throw new Error(`<Slider.${part}>은(는) <Slider.Root> 안에서만 사용할 수 있습니다.`);
  }
  return context;
}

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/

export interface SliderRootProps extends Omit<React.ComponentPropsWithoutRef<'div'>, 'defaultValue' | 'onChange'>, AsChildProps {
  /** 제어 모드의 값. */
  value?: number;
  /** 비제어 모드의 초기 값. 기본값은 min. */
  defaultValue?: number;
  /** 값이 바뀌어야 할 때 호출된다(드래그 중에도 계속). */
  onValueChange?: (value: number) => void;
  /** 사용자가 값을 확정했을 때(포인터를 뗄 때, 키를 눌렀을 때) 호출된다. */
  onValueCommit?: (value: number) => void;
  /** 최솟값. 기본값 0. */
  min?: number;
  /** 최댓값. 기본값 100. */
  max?: number;
  /** 값의 간격. 기본값 1. PageUp/PageDown은 step의 10배씩 움직인다. */
  step?: number;
  orientation?: Orientation;
  disabled?: boolean;
  /** 폼 제출용 이름. 지정하면 숨은 input에 현재 값을 담아 제출한다. */
  name?: string;
}

export const SliderRoot = React.forwardRef<HTMLDivElement, SliderRootProps>(
  (
    {
      asChild,
      value: valueProp,
      defaultValue,
      onValueChange,
      onValueCommit,
      min = 0,
      max = 100,
      step = 1,
      orientation = 'horizontal',
      disabled = false,
      name,
      style,
      onPointerDown,
      ...props
    },
    forwardedRef,
  ) => {
    const [rawValue, setRawValue] = useControllableState<number>({ prop: valueProp, defaultProp: defaultValue ?? min, onChange: onValueChange });
    const value = clamp(rawValue, min, max);
    const rootRef = React.useRef<HTMLDivElement | null>(null);
    const ref = useComposedRefs(forwardedRef, rootRef);
    const thumbRef = React.useRef<HTMLSpanElement | null>(null);
    const latest = React.useRef({ value, onValueCommit });
    latest.current = { value, onValueCommit };
    const stopDragRef = React.useRef<(() => void) | undefined>(undefined);

    React.useEffect(() => () => stopDragRef.current?.(), []);

    const setValue = React.useCallback(
      (next: number): number => {
        const snapped = snap(next, min, max, step);
        setRawValue(snapped);
        return snapped;
      },
      [setRawValue, min, max, step],
    );
    // 키보드는 방금 설정한 값을 넘기고, 포인터는 마지막으로 렌더된 값을 쓴다.
    const commit = React.useCallback((committed?: number) => latest.current.onValueCommit?.(committed ?? latest.current.value), []);

    const valueFromPointer = (event: PointerEvent): number | undefined => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return undefined;
      const ratio = orientation === 'horizontal' ? (event.clientX - rect.left) / rect.width : (rect.bottom - event.clientY) / rect.height;
      if (!Number.isFinite(ratio)) return undefined;
      return min + clamp(ratio, 0, 1) * (max - min);
    };

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
      if (disabled || event.button !== 0) return;
      const root = rootRef.current;
      if (!root) return;
      event.preventDefault(); // 드래그 중 텍스트 선택을 막는다.
      focus(thumbRef.current);
      const first = valueFromPointer(event.nativeEvent);
      if (first !== undefined) setValue(first);

      const doc = root.ownerDocument;
      const move = (e: PointerEvent): void => {
        const next = valueFromPointer(e);
        if (next !== undefined) setValue(next);
      };
      const end = (): void => {
        stop();
        commit();
      };
      const stop = (): void => {
        doc.removeEventListener('pointermove', move);
        doc.removeEventListener('pointerup', end);
        doc.removeEventListener('pointercancel', end);
        stopDragRef.current = undefined;
      };
      doc.addEventListener('pointermove', move);
      doc.addEventListener('pointerup', end);
      doc.addEventListener('pointercancel', end);
      stopDragRef.current = stop;
    };

    const context = React.useMemo<SliderContextValue>(
      () => ({ value, min, max, step, orientation, disabled, setValue, commit, thumbRef }),
      [value, min, max, step, orientation, disabled, setValue, commit],
    );
    const percent = max === min ? 0 : ((value - min) / (max - min)) * 100;
    const Comp = getComp('div', asChild);
    return (
      <SliderContext.Provider value={context}>
        <Comp
          data-orientation={orientation}
          data-disabled={disabled ? '' : undefined}
          // 썸과 범위의 위치를 CSS로 그릴 수 있도록 현재 비율을 변수로 노출한다(동작에 필요한 유일한 인라인 스타일).
          style={{ ['--logicui-slider-percent' as string]: `${percent}%`, ...style }}
          {...props}
          ref={ref}
          onPointerDown={composeEventHandlers(onPointerDown, handlePointerDown)}
        />
        {name !== undefined && <input type="hidden" name={name} value={value} disabled={disabled} />}
      </SliderContext.Provider>
    );
  },
);
SliderRoot.displayName = 'Slider.Root';

/* -------------------------------------------------------------------------------------------------
 * Track / Range
 * -----------------------------------------------------------------------------------------------*/

export type SliderTrackProps = React.ComponentPropsWithoutRef<'div'> & AsChildProps;

export const SliderTrack = React.forwardRef<HTMLDivElement, SliderTrackProps>(({ asChild, ...props }, forwardedRef) => {
  const context = useSliderContext('Track');
  const Comp = getComp('div', asChild);
  return <Comp data-orientation={context.orientation} data-disabled={context.disabled ? '' : undefined} {...props} ref={forwardedRef} />;
});
SliderTrack.displayName = 'Slider.Track';

export type SliderRangeProps = React.ComponentPropsWithoutRef<'div'> & AsChildProps;

/** 최솟값부터 현재 값까지의 구간. 너비·높이는 `var(--logicui-slider-percent)`로 그린다. */
export const SliderRange = React.forwardRef<HTMLDivElement, SliderRangeProps>(({ asChild, ...props }, forwardedRef) => {
  const context = useSliderContext('Range');
  const Comp = getComp('div', asChild);
  return <Comp data-orientation={context.orientation} data-disabled={context.disabled ? '' : undefined} {...props} ref={forwardedRef} />;
});
SliderRange.displayName = 'Slider.Range';

/* -------------------------------------------------------------------------------------------------
 * Thumb
 * -----------------------------------------------------------------------------------------------*/

export type SliderThumbProps = React.ComponentPropsWithoutRef<'span'> & AsChildProps;

/** role="slider"인 손잡이. aria-label 또는 aria-labelledby로 이름을 붙인다. */
export const SliderThumb = React.forwardRef<HTMLSpanElement, SliderThumbProps>(({ asChild, onKeyDown, ...props }, forwardedRef) => {
  const context = useSliderContext('Thumb');
  const ref = useComposedRefs(forwardedRef, context.thumbRef);
  const { value, min, max, step, disabled, setValue, commit } = context;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>): void => {
    if (disabled) return;
    const large = step * 10;
    let next: number | undefined;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = value + step;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = value - step;
    else if (event.key === 'PageUp') next = value + large;
    else if (event.key === 'PageDown') next = value - large;
    else if (event.key === 'Home') next = min;
    else if (event.key === 'End') next = max;
    if (next === undefined) return;
    // APG: →/↑는 증가, ←/↓는 감소. 방향과 무관하게 같은 키를 쓴다.
    event.preventDefault();
    commit(setValue(next));
  };

  const Comp = getComp('span', asChild);
  return (
    <Comp
      role="slider"
      tabIndex={disabled ? undefined : 0}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-orientation={context.orientation}
      aria-disabled={disabled || undefined}
      data-orientation={context.orientation}
      data-disabled={disabled ? '' : undefined}
      {...props}
      ref={ref}
      onKeyDown={composeEventHandlers(onKeyDown, handleKeyDown)}
    />
  );
});
SliderThumb.displayName = 'Slider.Thumb';

export { SliderRoot as Root, SliderTrack as Track, SliderRange as Range, SliderThumb as Thumb };
