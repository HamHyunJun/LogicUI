import * as React from 'react';
import { getComp, type AsChildProps } from '../shared/primitive';

/*
 * WAI-ARIA progressbar 역할. 키보드 상호작용이 없는 표시 컴포넌트다.
 * 접근 가능한 이름(aria-label 또는 aria-labelledby)은 소비자가 붙인다.
 */

type ProgressState = 'indeterminate' | 'loading' | 'complete';

interface ProgressContextValue {
  value: number | undefined;
  max: number;
  state: ProgressState;
}

const ProgressContext = React.createContext<ProgressContextValue | null>(null);

const isValidValue = (value: number | null | undefined, max: number): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max;

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/

export interface ProgressRootProps extends Omit<React.ComponentPropsWithoutRef<'div'>, 'children'>, AsChildProps {
  children?: React.ReactNode;
  /** 현재 값(0~max). null·undefined이거나 범위를 벗어나면 진행 정도를 알 수 없는 상태(indeterminate)로 다룬다. */
  value?: number | null;
  /** 최댓값. 기본값 100. */
  max?: number;
  /** aria-valuetext로 쓸 사람이 읽을 수 있는 값 설명. 기본은 생략(스크린리더가 aria-valuenow로 읽는다). */
  getValueLabel?: (value: number, max: number) => string;
}

export const ProgressRoot = React.forwardRef<HTMLDivElement, ProgressRootProps>(
  ({ asChild, value: valueProp, max = 100, getValueLabel, ...props }, forwardedRef) => {
    const value = isValidValue(valueProp, max) ? valueProp : undefined;
    const state: ProgressState = value === undefined ? 'indeterminate' : value === max ? 'complete' : 'loading';
    const context = React.useMemo<ProgressContextValue>(() => ({ value, max, state }), [value, max, state]);
    const Comp = getComp('div', asChild);
    return (
      <ProgressContext.Provider value={context}>
        <Comp
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={value !== undefined ? getValueLabel?.(value, max) : undefined}
          data-state={state}
          data-value={value}
          data-max={max}
          {...props}
          ref={forwardedRef}
        />
      </ProgressContext.Provider>
    );
  },
);
ProgressRoot.displayName = 'Progress.Root';

/* -------------------------------------------------------------------------------------------------
 * Indicator
 * -----------------------------------------------------------------------------------------------*/

export type ProgressIndicatorProps = React.ComponentPropsWithoutRef<'div'> & AsChildProps;

/** 진행 정도를 시각적으로 나타내는 요소. 너비 등은 data-value·data-max를 보고 스타일링한다. */
export const ProgressIndicator = React.forwardRef<HTMLDivElement, ProgressIndicatorProps>(({ asChild, ...props }, forwardedRef) => {
  const context = React.useContext(ProgressContext);
  if (!context) {
    throw new Error('<Progress.Indicator>은(는) <Progress.Root> 안에서만 사용할 수 있습니다.');
  }
  const Comp = getComp('div', asChild);
  return <Comp data-state={context.state} data-value={context.value} data-max={context.max} {...props} ref={forwardedRef} />;
});
ProgressIndicator.displayName = 'Progress.Indicator';

export { ProgressRoot as Root, ProgressIndicator as Indicator };
