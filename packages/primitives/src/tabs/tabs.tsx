import * as React from 'react';
import { composeEventHandlers } from '../shared/compose-event-handlers';
import { focus } from '../shared/dom';
import { getComp, type AsChildProps } from '../shared/primitive';
import { useControllableState } from '../shared/use-controllable-state';

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/

type Orientation = 'horizontal' | 'vertical';
type ActivationMode = 'automatic' | 'manual';

interface TabsContextValue {
  value: string | undefined;
  onValueChange: (value: string) => void;
  orientation: Orientation;
  activationMode: ActivationMode;
  baseId: string;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext(part: string): TabsContextValue {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error(`<Tabs.${part}>은(는) <Tabs.Root> 안에서만 사용할 수 있습니다.`);
  }
  return context;
}

// shortcut: value에 공백이 있으면 aria-controls/labelledby id가 깨진다, 공백 없는 value를 쓰도록 안내.
const getTriggerId = (baseId: string, value: string) => `${baseId}-trigger-${value}`;
const getContentId = (baseId: string, value: string) => `${baseId}-content-${value}`;
const getState = (active: boolean) => (active ? 'active' : 'inactive');

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/

export interface TabsRootProps extends Omit<React.ComponentPropsWithoutRef<'div'>, 'defaultValue' | 'onChange'>, AsChildProps {
  /** 제어 모드의 선택된 탭 값. */
  value?: string;
  /** 비제어 모드의 초기 선택 값. */
  defaultValue?: string;
  /** 선택이 바뀌어야 할 때 호출된다. */
  onValueChange?: (value: string) => void;
  /** 방향키 축. horizontal은 ←/→, vertical은 ↑/↓. */
  orientation?: Orientation;
  /** automatic(기본값)은 포커스 이동과 동시에 선택, manual은 Enter/Space로 선택한다. */
  activationMode?: ActivationMode;
}

export const TabsRoot = React.forwardRef<HTMLDivElement, TabsRootProps>(
  (
    { asChild, value: valueProp, defaultValue, onValueChange, orientation = 'horizontal', activationMode = 'automatic', ...props },
    forwardedRef,
  ) => {
    const [value, setValue] = useControllableState<string | undefined>({
      prop: valueProp,
      defaultProp: defaultValue,
      onChange: (next) => {
        if (next !== undefined) onValueChange?.(next);
      },
    });
    const baseId = React.useId();
    const context = React.useMemo<TabsContextValue>(
      () => ({ value, onValueChange: setValue, orientation, activationMode, baseId }),
      [value, setValue, orientation, activationMode, baseId],
    );
    const Comp = getComp('div', asChild);
    return (
      <TabsContext.Provider value={context}>
        <Comp data-orientation={orientation} {...props} ref={forwardedRef} />
      </TabsContext.Provider>
    );
  },
);
TabsRoot.displayName = 'Tabs.Root';

/* -------------------------------------------------------------------------------------------------
 * List
 * -----------------------------------------------------------------------------------------------*/

export type TabsListProps = React.ComponentPropsWithoutRef<'div'> & AsChildProps;

export const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(({ asChild, ...props }, forwardedRef) => {
  const { orientation } = useTabsContext('List');
  const Comp = getComp('div', asChild);
  return <Comp role="tablist" aria-orientation={orientation} data-orientation={orientation} {...props} ref={forwardedRef} />;
});
TabsList.displayName = 'Tabs.List';

/* -------------------------------------------------------------------------------------------------
 * Trigger
 * -----------------------------------------------------------------------------------------------*/

export interface TabsTriggerProps extends React.ComponentPropsWithoutRef<'button'>, AsChildProps {
  /** 이 탭을 식별하는 값. 대응하는 Tabs.Content의 value와 같아야 한다. */
  value: string;
}

export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ asChild, value, onClick, onKeyDown, ...props }, forwardedRef) => {
    const context = useTabsContext('Trigger');
    const isSelected = context.value === value;
    const Comp = getComp('button', asChild);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>): void => {
      const [prevKey, nextKey] = context.orientation === 'horizontal' ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown'];
      const list = event.currentTarget.closest('[role="tablist"]');
      if (!list) return;
      const tabs = Array.from(list.querySelectorAll<HTMLElement>('[role="tab"]:not([disabled])'));
      const index = tabs.indexOf(event.currentTarget);
      let next: HTMLElement | undefined;
      if (event.key === nextKey) next = tabs[(index + 1) % tabs.length];
      else if (event.key === prevKey) next = tabs[(index - 1 + tabs.length) % tabs.length];
      else if (event.key === 'Home') next = tabs[0];
      else if (event.key === 'End') next = tabs[tabs.length - 1];
      if (!next) return;
      event.preventDefault();
      focus(next);
      // 자동 활성화에서는 포커스가 곧 선택이다. 클릭 경로를 재사용해 선택 로직을 한 곳에 둔다.
      if (context.activationMode === 'automatic') next.click();
    };

    return (
      <Comp
        type={asChild ? undefined : 'button'}
        role="tab"
        id={getTriggerId(context.baseId, value)}
        aria-selected={isSelected}
        aria-controls={isSelected ? getContentId(context.baseId, value) : undefined}
        // 선택된 탭만 Tab 순서에 둔다(로빙 tabindex). 선택이 없으면 모든 탭에 도달할 수 있어야 한다.
        tabIndex={isSelected || context.value === undefined ? 0 : -1}
        data-state={getState(isSelected)}
        data-orientation={context.orientation}
        {...props}
        ref={forwardedRef}
        onClick={composeEventHandlers(onClick, () => context.onValueChange(value))}
        onKeyDown={composeEventHandlers(onKeyDown, handleKeyDown)}
      />
    );
  },
);
TabsTrigger.displayName = 'Tabs.Trigger';

/* -------------------------------------------------------------------------------------------------
 * Content
 * -----------------------------------------------------------------------------------------------*/

export interface TabsContentProps extends React.ComponentPropsWithoutRef<'div'>, AsChildProps {
  /** 대응하는 Tabs.Trigger의 value. */
  value: string;
  /** 선택되지 않아도 DOM에 유지한다 (`hidden`으로 숨김). */
  forceMount?: boolean;
}

export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ asChild, value, forceMount, ...props }, forwardedRef) => {
    const context = useTabsContext('Content');
    const isSelected = context.value === value;
    if (!isSelected && !forceMount) return null;
    const Comp = getComp('div', asChild);
    return (
      <Comp
        role="tabpanel"
        id={getContentId(context.baseId, value)}
        aria-labelledby={getTriggerId(context.baseId, value)}
        tabIndex={0}
        hidden={!isSelected}
        data-state={getState(isSelected)}
        data-orientation={context.orientation}
        {...props}
        ref={forwardedRef}
      />
    );
  },
);
TabsContent.displayName = 'Tabs.Content';

/* -------------------------------------------------------------------------------------------------
 * 합성 컴포넌트용 짧은 이름
 * -----------------------------------------------------------------------------------------------*/

export { TabsRoot as Root, TabsList as List, TabsTrigger as Trigger, TabsContent as Content };
