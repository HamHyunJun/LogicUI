import * as React from 'react';
import { composeEventHandlers } from '../shared/compose-event-handlers';
import { useComposedRefs } from '../shared/compose-refs';
import { focus } from '../shared/dom';
import { getComp, type AsChildProps } from '../shared/primitive';
import { useControllableState } from '../shared/use-controllable-state';
import { useIsomorphicLayoutEffect } from '../shared/use-isomorphic-layout-effect';

/*
 * 토글 버튼(aria-pressed)의 묶음. WAI-ARIA APG Button(toggle)과 Toolbar의 로빙 포커스를 따른다.
 * 그룹 전체가 탭 정지점 하나이고, 방향키는 포커스만 옮긴다(선택은 Space/Enter).
 */

type Orientation = 'horizontal' | 'vertical';

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/

interface ToggleGroupContextValue {
  type: 'single' | 'multiple';
  value: string[];
  onItemToggle: (value: string) => void;
  disabled: boolean;
  orientation: Orientation;
  loop: boolean;
  tabStop: string | undefined;
  onItemFocus: (value: string) => void;
}

const ToggleGroupContext = React.createContext<ToggleGroupContextValue | null>(null);

function useToggleGroupContext(part: string): ToggleGroupContextValue {
  const context = React.useContext(ToggleGroupContext);
  if (!context) {
    throw new Error(`<ToggleGroup.${part}>은(는) <ToggleGroup.Root> 안에서만 사용할 수 있습니다.`);
  }
  return context;
}

const ITEM_ATTR = 'data-toggle-group-item';

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/

export interface ToggleGroupRootProps extends Omit<React.ComponentPropsWithoutRef<'div'>, 'defaultValue' | 'onChange'>, AsChildProps {
  /** single은 한 번에 하나만, multiple은 여러 개를 켤 수 있다. 기본값은 single. */
  type?: 'single' | 'multiple';
  /** 제어 모드의 켜진 항목 값 목록. single에서도 배열(최대 1개)이다. */
  value?: string[];
  /** 비제어 모드의 초기 켜진 항목 값 목록. */
  defaultValue?: string[];
  /** 켜진 항목이 바뀌어야 할 때 호출된다. */
  onValueChange?: (value: string[]) => void;
  /** 모든 항목을 비활성화한다. */
  disabled?: boolean;
  /** 방향키 축. horizontal은 ←/→, vertical은 ↑/↓. 기본값 horizontal. */
  orientation?: Orientation;
  /** 양 끝에서 반대편으로 순환한다. 기본값 true. */
  loop?: boolean;
}

export const ToggleGroupRoot = React.forwardRef<HTMLDivElement, ToggleGroupRootProps>(
  (
    { asChild, type = 'single', value: valueProp, defaultValue = [], onValueChange, disabled = false, orientation = 'horizontal', loop = true, ...props },
    forwardedRef,
  ) => {
    const [value, setValue] = useControllableState<string[]>({ prop: valueProp, defaultProp: defaultValue, onChange: onValueChange });
    const rootRef = React.useRef<HTMLDivElement | null>(null);
    const ref = useComposedRefs(forwardedRef, rootRef);
    const [focusedValue, setFocusedValue] = React.useState<string | undefined>(undefined);
    const [defaultStop, setDefaultStop] = React.useState<string | undefined>(undefined);

    // 아직 포커스한 적이 없으면 켜진 첫 활성 항목(없으면 첫 활성 항목)이 Tab 정지점이다.
    useIsomorphicLayoutEffect(() => {
      const enabled = Array.from(rootRef.current?.querySelectorAll<HTMLElement>(`[${ITEM_ATTR}]:not([disabled])`) ?? []);
      const stop = enabled.find((el) => el.getAttribute('aria-pressed') === 'true') ?? enabled[0];
      setDefaultStop(stop?.getAttribute(ITEM_ATTR) ?? undefined);
    });

    const onItemToggle = React.useCallback(
      (item: string) => {
        if (type === 'multiple') setValue(value.includes(item) ? value.filter((v) => v !== item) : [...value, item]);
        else setValue(value.includes(item) ? [] : [item]);
      },
      [type, value, setValue],
    );

    const context = React.useMemo<ToggleGroupContextValue>(
      () => ({ type, value, onItemToggle, disabled, orientation, loop, tabStop: focusedValue ?? defaultStop, onItemFocus: setFocusedValue }),
      [type, value, onItemToggle, disabled, orientation, loop, focusedValue, defaultStop],
    );
    const Comp = getComp('div', asChild);
    return (
      <ToggleGroupContext.Provider value={context}>
        <Comp role="group" data-orientation={orientation} data-disabled={disabled ? '' : undefined} {...props} ref={ref} />
      </ToggleGroupContext.Provider>
    );
  },
);
ToggleGroupRoot.displayName = 'ToggleGroup.Root';

/* -------------------------------------------------------------------------------------------------
 * Item
 * -----------------------------------------------------------------------------------------------*/

export interface ToggleGroupItemProps extends Omit<React.ComponentPropsWithoutRef<'button'>, 'value'>, AsChildProps {
  /** 이 항목을 식별하는 값. */
  value: string;
}

export const ToggleGroupItem = React.forwardRef<HTMLButtonElement, ToggleGroupItemProps>(
  ({ asChild, value, disabled: disabledProp, onClick, onKeyDown, onFocus, ...props }, forwardedRef) => {
    const group = useToggleGroupContext('Item');
    const disabled = group.disabled || !!disabledProp;
    const pressed = group.value.includes(value);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>): void => {
      const [prevKey, nextKey] = group.orientation === 'horizontal' ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown'];
      const root = event.currentTarget.closest('[role="group"]');
      if (!root) return;
      const items = Array.from(root.querySelectorAll<HTMLElement>(`[${ITEM_ATTR}]:not([disabled])`));
      const index = items.indexOf(event.currentTarget);
      if (index === -1) return;
      let next: HTMLElement | undefined;
      if (event.key === nextKey) next = items[index + 1] ?? (group.loop ? items[0] : undefined);
      else if (event.key === prevKey) next = items[index - 1] ?? (group.loop ? items[items.length - 1] : undefined);
      else if (event.key === 'Home') next = items[0];
      else if (event.key === 'End') next = items[items.length - 1];
      else return;
      event.preventDefault();
      focus(next);
    };

    const Comp = getComp('button', asChild);
    return (
      <Comp
        type={asChild ? undefined : 'button'}
        aria-pressed={pressed}
        disabled={disabled}
        tabIndex={group.tabStop === value ? 0 : -1}
        data-state={pressed ? 'on' : 'off'}
        data-disabled={disabled ? '' : undefined}
        data-orientation={group.orientation}
        {...{ [ITEM_ATTR]: value }}
        {...props}
        ref={forwardedRef}
        onClick={composeEventHandlers(onClick, () => group.onItemToggle(value))}
        onKeyDown={composeEventHandlers(onKeyDown, handleKeyDown)}
        onFocus={composeEventHandlers(onFocus, () => group.onItemFocus(value))}
      />
    );
  },
);
ToggleGroupItem.displayName = 'ToggleGroup.Item';

export { ToggleGroupRoot as Root, ToggleGroupItem as Item };
