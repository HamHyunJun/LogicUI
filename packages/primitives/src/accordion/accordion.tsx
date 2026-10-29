import * as React from 'react';
import { composeEventHandlers } from '../shared/compose-event-handlers';
import { useComposedRefs } from '../shared/compose-refs';
import { focus } from '../shared/dom';
import { getComp, type AsChildProps } from '../shared/primitive';
import { useControllableState } from '../shared/use-controllable-state';

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/

type AccordionType = 'single' | 'multiple';

interface AccordionContextValue {
  value: string[];
  type: AccordionType;
  collapsible: boolean;
  disabled: boolean;
  onItemToggle: (value: string) => void;
  rootRef: React.RefObject<HTMLDivElement | null>;
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

function useAccordionContext(part: string): AccordionContextValue {
  const context = React.useContext(AccordionContext);
  if (!context) {
    throw new Error(`<Accordion.${part}>은(는) <Accordion.Root> 안에서만 사용할 수 있습니다.`);
  }
  return context;
}

interface ItemContextValue {
  open: boolean;
  disabled: boolean;
  triggerId: string;
  contentId: string;
  value: string;
}

const ItemContext = React.createContext<ItemContextValue | null>(null);

function useItemContext(part: string): ItemContextValue {
  const context = React.useContext(ItemContext);
  if (!context) {
    throw new Error(`<Accordion.${part}>은(는) <Accordion.Item> 안에서만 사용할 수 있습니다.`);
  }
  return context;
}

const getState = (open: boolean) => (open ? 'open' : 'closed');

// Trigger 사이의 방향키 이동 대상을 찾는 데 쓰는 내부 표식.
const TRIGGER_ATTR = 'data-accordion-trigger';

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/

export interface AccordionRootProps extends Omit<React.ComponentPropsWithoutRef<'div'>, 'defaultValue' | 'onChange'>, AsChildProps {
  /** single은 한 번에 하나만, multiple은 여러 개를 열 수 있다. 기본값은 single. */
  type?: AccordionType;
  /** 제어 모드의 열린 아이템 값 목록. single에서도 배열(최대 1개)이다. */
  value?: string[];
  /** 비제어 모드의 초기 열린 아이템 값 목록. */
  defaultValue?: string[];
  /** 열린 아이템이 바뀌어야 할 때 호출된다. */
  onValueChange?: (value: string[]) => void;
  /** single에서 열린 아이템을 다시 눌러 닫을 수 있게 한다. 기본값은 false (APG 기본 동작). */
  collapsible?: boolean;
  /** 모든 아이템을 비활성화한다. */
  disabled?: boolean;
}

export const AccordionRoot = React.forwardRef<HTMLDivElement, AccordionRootProps>(
  (
    { asChild, type = 'single', value: valueProp, defaultValue, onValueChange, collapsible = false, disabled = false, ...props },
    forwardedRef,
  ) => {
    const rootRef = React.useRef<HTMLDivElement | null>(null);
    const ref = useComposedRefs(forwardedRef, rootRef);
    const [value, setValue] = useControllableState<string[]>({
      prop: valueProp,
      defaultProp: defaultValue ?? [],
      onChange: onValueChange,
    });

    const onItemToggle = React.useCallback(
      (itemValue: string): void => {
        const isOpen = value.includes(itemValue);
        if (type === 'multiple') {
          setValue(isOpen ? value.filter((v) => v !== itemValue) : [...value, itemValue]);
        } else if (!isOpen) {
          setValue([itemValue]);
        } else if (collapsible) {
          setValue([]);
        }
      },
      [value, type, collapsible, setValue],
    );

    const context = React.useMemo<AccordionContextValue>(
      () => ({ value, type, collapsible, disabled, onItemToggle, rootRef }),
      [value, type, collapsible, disabled, onItemToggle],
    );
    const Comp = getComp('div', asChild);
    return (
      <AccordionContext.Provider value={context}>
        <Comp {...props} ref={ref} />
      </AccordionContext.Provider>
    );
  },
);
AccordionRoot.displayName = 'Accordion.Root';

/* -------------------------------------------------------------------------------------------------
 * Item
 * -----------------------------------------------------------------------------------------------*/

export interface AccordionItemProps extends React.ComponentPropsWithoutRef<'div'>, AsChildProps {
  /** 이 아이템을 식별하는 값. */
  value: string;
  /** 이 아이템만 비활성화한다. */
  disabled?: boolean;
}

export const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ asChild, value, disabled: disabledProp = false, ...props }, forwardedRef) => {
    const accordion = useAccordionContext('Item');
    const baseId = React.useId();
    const open = accordion.value.includes(value);
    const disabled = accordion.disabled || disabledProp;
    const context = React.useMemo<ItemContextValue>(
      () => ({ open, disabled, value, triggerId: `${baseId}-trigger`, contentId: `${baseId}-content` }),
      [open, disabled, value, baseId],
    );
    const Comp = getComp('div', asChild);
    return (
      <ItemContext.Provider value={context}>
        <Comp data-state={getState(open)} data-disabled={disabled ? '' : undefined} {...props} ref={forwardedRef} />
      </ItemContext.Provider>
    );
  },
);
AccordionItem.displayName = 'Accordion.Item';

/* -------------------------------------------------------------------------------------------------
 * Header
 * -----------------------------------------------------------------------------------------------*/

export type AccordionHeaderProps = React.ComponentPropsWithoutRef<'h3'> & AsChildProps;

/** 기본은 h3. 문서의 제목 단계에 맞추려면 asChild로 다른 h 요소를 넘긴다. */
export const AccordionHeader = React.forwardRef<HTMLHeadingElement, AccordionHeaderProps>(
  ({ asChild, ...props }, forwardedRef) => {
    const item = useItemContext('Header');
    const Comp = getComp('h3', asChild);
    return <Comp data-state={getState(item.open)} data-disabled={item.disabled ? '' : undefined} {...props} ref={forwardedRef} />;
  },
);
AccordionHeader.displayName = 'Accordion.Header';

/* -------------------------------------------------------------------------------------------------
 * Trigger
 * -----------------------------------------------------------------------------------------------*/

export type AccordionTriggerProps = React.ComponentPropsWithoutRef<'button'> & AsChildProps;

export const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ asChild, onClick, onKeyDown, ...props }, forwardedRef) => {
    const accordion = useAccordionContext('Trigger');
    const item = useItemContext('Trigger');
    // single + 비collapsible에서 열려 있는 아이템은 닫을 수 없다 (APG: aria-disabled).
    const cannotClose = item.open && accordion.type === 'single' && !accordion.collapsible;
    const Comp = getComp('button', asChild);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>): void => {
      const root = accordion.rootRef.current;
      if (!root) return;
      const triggers = Array.from(root.querySelectorAll<HTMLElement>(`[${TRIGGER_ATTR}]:not([disabled])`));
      const index = triggers.indexOf(event.currentTarget);
      let next: HTMLElement | undefined;
      if (event.key === 'ArrowDown') next = triggers[(index + 1) % triggers.length];
      else if (event.key === 'ArrowUp') next = triggers[(index - 1 + triggers.length) % triggers.length];
      else if (event.key === 'Home') next = triggers[0];
      else if (event.key === 'End') next = triggers[triggers.length - 1];
      if (!next) return;
      event.preventDefault();
      focus(next);
    };

    return (
      <Comp
        type={asChild ? undefined : 'button'}
        id={item.triggerId}
        disabled={item.disabled}
        aria-expanded={item.open}
        // 닫힌 패널은 렌더하지 않으므로 열려 있을 때만 대상 id를 가리킨다.
        aria-controls={item.open ? item.contentId : undefined}
        aria-disabled={cannotClose ? true : undefined}
        data-state={getState(item.open)}
        data-disabled={item.disabled ? '' : undefined}
        {...{ [TRIGGER_ATTR]: '' }}
        {...props}
        ref={forwardedRef}
        onClick={composeEventHandlers(onClick, () => accordion.onItemToggle(item.value))}
        onKeyDown={composeEventHandlers(onKeyDown, handleKeyDown)}
      />
    );
  },
);
AccordionTrigger.displayName = 'Accordion.Trigger';

/* -------------------------------------------------------------------------------------------------
 * Content
 * -----------------------------------------------------------------------------------------------*/

export interface AccordionContentProps extends React.ComponentPropsWithoutRef<'div'>, AsChildProps {
  /** 닫혀 있어도 DOM에 유지한다 (`hidden`으로 숨김). 닫힘 애니메이션을 직접 제어할 때 쓴다. */
  forceMount?: boolean;
}

export const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ asChild, forceMount, ...props }, forwardedRef) => {
    const item = useItemContext('Content');
    if (!item.open && !forceMount) return null;
    const Comp = getComp('div', asChild);
    return (
      <Comp
        role="region"
        id={item.contentId}
        aria-labelledby={item.triggerId}
        hidden={!item.open}
        data-state={getState(item.open)}
        data-disabled={item.disabled ? '' : undefined}
        {...props}
        ref={forwardedRef}
      />
    );
  },
);
AccordionContent.displayName = 'Accordion.Content';

/* -------------------------------------------------------------------------------------------------
 * 합성 컴포넌트용 짧은 이름
 * -----------------------------------------------------------------------------------------------*/

export {
  AccordionRoot as Root,
  AccordionItem as Item,
  AccordionHeader as Header,
  AccordionTrigger as Trigger,
  AccordionContent as Content,
};
