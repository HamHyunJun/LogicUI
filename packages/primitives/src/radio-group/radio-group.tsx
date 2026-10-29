import * as React from 'react';
import { composeEventHandlers } from '../shared/compose-event-handlers';
import { useComposedRefs } from '../shared/compose-refs';
import { focus } from '../shared/dom';
import { getComp, type AsChildProps } from '../shared/primitive';
import { useControllableState } from '../shared/use-controllable-state';
import { useIsomorphicLayoutEffect } from '../shared/use-isomorphic-layout-effect';

/*
 * WAI-ARIA APG Radio Group 패턴.
 * 그룹 전체가 탭 정지점 하나(로빙 tabindex)이고, 방향키는 포커스를 옮기면서 선택까지 한다.
 */

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/

interface RadioGroupContextValue {
  value: string | undefined;
  onValueChange: (value: string) => void;
  disabled: boolean;
  name: string | undefined;
  required: boolean;
  orientation: 'horizontal' | 'vertical' | undefined;
  /** 선택된 값이 없을 때 Tab으로 들어올 첫 활성 항목의 값. */
  tabbableValue: string | undefined;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null);

function useRadioGroupContext(part: string): RadioGroupContextValue {
  const context = React.useContext(RadioGroupContext);
  if (!context) {
    throw new Error(`<RadioGroup.${part}>은(는) <RadioGroup.Root> 안에서만 사용할 수 있습니다.`);
  }
  return context;
}

const ITEM_ATTR = 'data-radio-group-item';
const getState = (checked: boolean) => (checked ? 'checked' : 'unchecked');

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/

export interface RadioGroupRootProps extends Omit<React.ComponentPropsWithoutRef<'div'>, 'defaultValue' | 'onChange'>, AsChildProps {
  /** 제어 모드의 선택 값. */
  value?: string;
  /** 비제어 모드의 초기 선택 값. */
  defaultValue?: string;
  /** 선택 값이 바뀌어야 할 때 호출된다. */
  onValueChange?: (value: string) => void;
  /** 모든 항목을 비활성화한다. */
  disabled?: boolean;
  /** 폼 제출용 이름. 지정하면 선택된 항목의 값이 숨은 radio input으로 제출된다. */
  name?: string;
  /** 폼 검증에서 필수로 표시한다(aria-required). */
  required?: boolean;
  /** 스타일링용 방향 정보(data-orientation). 방향키 동작은 방향과 무관하다(APG). */
  orientation?: 'horizontal' | 'vertical';
}

export const RadioGroupRoot = React.forwardRef<HTMLDivElement, RadioGroupRootProps>(
  ({ asChild, value: valueProp, defaultValue, onValueChange, disabled = false, name, required = false, orientation, ...props }, forwardedRef) => {
    const [value, setValue] = useControllableState<string | undefined>({
      prop: valueProp,
      defaultProp: defaultValue,
      onChange: (next) => next !== undefined && onValueChange?.(next),
    });
    const rootRef = React.useRef<HTMLDivElement | null>(null);
    const ref = useComposedRefs(forwardedRef, rootRef);
    const [tabbableValue, setTabbableValue] = React.useState<string | undefined>(undefined);

    // 선택된 값이 없으면 첫 번째 활성 항목이 Tab 정지점이 된다.
    useIsomorphicLayoutEffect(() => {
      const first = rootRef.current?.querySelector<HTMLElement>(`[${ITEM_ATTR}]:not([disabled])`);
      setTabbableValue(first?.getAttribute(ITEM_ATTR) ?? undefined);
    });

    const context = React.useMemo<RadioGroupContextValue>(
      () => ({ value, onValueChange: setValue, disabled, name, required, orientation, tabbableValue }),
      [value, setValue, disabled, name, required, orientation, tabbableValue],
    );
    const Comp = getComp('div', asChild);
    return (
      <RadioGroupContext.Provider value={context}>
        <Comp
          role="radiogroup"
          aria-required={required || undefined}
          aria-disabled={disabled || undefined}
          data-orientation={orientation}
          data-disabled={disabled ? '' : undefined}
          {...props}
          ref={ref}
        />
      </RadioGroupContext.Provider>
    );
  },
);
RadioGroupRoot.displayName = 'RadioGroup.Root';

/* -------------------------------------------------------------------------------------------------
 * Item
 * -----------------------------------------------------------------------------------------------*/

interface RadioItemContextValue {
  checked: boolean;
  disabled: boolean;
}

const RadioItemContext = React.createContext<RadioItemContextValue | null>(null);

export interface RadioGroupItemProps extends Omit<React.ComponentPropsWithoutRef<'button'>, 'value'>, AsChildProps {
  /** 이 항목이 나타내는 값. 그룹의 value와 같으면 선택된 상태다. */
  value: string;
}

export const RadioGroupItem = React.forwardRef<HTMLButtonElement, RadioGroupItemProps>(
  ({ asChild, value, disabled: disabledProp, onClick, onKeyDown, ...props }, forwardedRef) => {
    const group = useRadioGroupContext('Item');
    const disabled = group.disabled || !!disabledProp;
    const checked = group.value === value;
    const tabbable = checked || (group.value === undefined && group.tabbableValue === value);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>): void => {
      // Enter는 APG에 없고 폼 제출과 혼동되므로 막는다.
      if (event.key === 'Enter') {
        event.preventDefault();
        return;
      }
      const forward = event.key === 'ArrowDown' || event.key === 'ArrowRight';
      const backward = event.key === 'ArrowUp' || event.key === 'ArrowLeft';
      if (!forward && !backward) return;
      const root = event.currentTarget.closest('[role="radiogroup"]');
      if (!root) return;
      const items = Array.from(root.querySelectorAll<HTMLButtonElement>(`[${ITEM_ATTR}]:not([disabled])`));
      const index = items.indexOf(event.currentTarget);
      if (index === -1) return;
      event.preventDefault();
      const next = items[(index + (forward ? 1 : -1) + items.length) % items.length];
      if (!next) return;
      focus(next);
      next.click(); // APG: 방향키는 포커스 이동과 선택을 함께 한다.
    };

    const context = React.useMemo<RadioItemContextValue>(() => ({ checked, disabled }), [checked, disabled]);
    const Comp = getComp('button', asChild);
    return (
      <RadioItemContext.Provider value={context}>
        <Comp
          type={asChild ? undefined : 'button'}
          role="radio"
          aria-checked={checked}
          disabled={disabled}
          tabIndex={tabbable ? 0 : -1}
          data-state={getState(checked)}
          data-disabled={disabled ? '' : undefined}
          {...{ [ITEM_ATTR]: value }}
          {...props}
          ref={forwardedRef}
          onClick={composeEventHandlers(onClick, () => {
            if (!checked) group.onValueChange(value);
          })}
          onKeyDown={composeEventHandlers(onKeyDown, handleKeyDown)}
        />
        {group.name !== undefined && (
          <input type="radio" hidden aria-hidden="true" tabIndex={-1} readOnly name={group.name} value={value} checked={checked} disabled={disabled} />
        )}
      </RadioItemContext.Provider>
    );
  },
);
RadioGroupItem.displayName = 'RadioGroup.Item';

/* -------------------------------------------------------------------------------------------------
 * Indicator
 * -----------------------------------------------------------------------------------------------*/

export interface RadioGroupIndicatorProps extends React.ComponentPropsWithoutRef<'span'>, AsChildProps {
  /** 선택되지 않았어도 렌더한다. */
  forceMount?: boolean;
}

/** 선택된 항목에서만 렌더되는 표시 영역. */
export const RadioGroupIndicator = React.forwardRef<HTMLSpanElement, RadioGroupIndicatorProps>(
  ({ asChild, forceMount, ...props }, forwardedRef) => {
    const item = React.useContext(RadioItemContext);
    if (!item) {
      throw new Error('<RadioGroup.Indicator>은(는) <RadioGroup.Item> 안에서만 사용할 수 있습니다.');
    }
    if (!(forceMount || item.checked)) return null;
    const Comp = getComp('span', asChild);
    return <Comp data-state={getState(item.checked)} data-disabled={item.disabled ? '' : undefined} {...props} ref={forwardedRef} />;
  },
);
RadioGroupIndicator.displayName = 'RadioGroup.Indicator';

/* -------------------------------------------------------------------------------------------------
 * 합성 컴포넌트용 짧은 이름
 * -----------------------------------------------------------------------------------------------*/

export { RadioGroupRoot as Root, RadioGroupItem as Item, RadioGroupIndicator as Indicator };
