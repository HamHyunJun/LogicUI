import * as React from 'react';
import { composeEventHandlers } from '../shared/compose-event-handlers';
import { useComposedRefs } from '../shared/compose-refs';
import { focus } from '../shared/dom';
import { layerStack } from '../shared/layer-stack';
import { Portal } from '../shared/portal';
import type { Align, Side } from '../shared/position';
import { getComp, type AsChildProps } from '../shared/primitive';
import { useControllableState } from '../shared/use-controllable-state';
import { useFloatingPosition } from '../shared/use-floating-position';
import { useIsomorphicLayoutEffect } from '../shared/use-isomorphic-layout-effect';

/*
 * WAI-ARIA APG Menu Button 패턴.
 * shortcut: 서브메뉴(ArrowRight/Left로 여닫기)는 지원하지 않는다, 필요해지면 Menu.Sub를 추가한다.
 */

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/

interface MenuContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenToggle: () => void;
  contentId: string;
  triggerId: string;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  /** 열릴 때 포커스할 항목. 트리거의 ArrowUp이면 마지막, 그 외에는 첫 항목. */
  openIntentRef: React.RefObject<'first' | 'last'>;
}

const MenuContext = React.createContext<MenuContextValue | null>(null);

function useMenuContext(part: string): MenuContextValue {
  const context = React.useContext(MenuContext);
  if (!context) {
    throw new Error(`<Menu.${part}>은(는) <Menu.Root> 안에서만 사용할 수 있습니다.`);
  }
  return context;
}

const getState = (open: boolean) => (open ? 'open' : 'closed');

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/

export interface MenuRootProps {
  children?: React.ReactNode;
  /** 제어 모드의 열림 상태. */
  open?: boolean;
  /** 비제어 모드의 초기 열림 상태. */
  defaultOpen?: boolean;
  /** 열림 상태가 바뀌어야 할 때 호출된다. */
  onOpenChange?: (open: boolean) => void;
}

export function MenuRoot({ children, open: openProp, defaultOpen = false, onOpenChange }: MenuRootProps) {
  const [open, setOpen] = useControllableState({ prop: openProp, defaultProp: defaultOpen, onChange: onOpenChange });
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const openIntentRef = React.useRef<'first' | 'last'>('first');
  const baseId = React.useId();

  const value = React.useMemo<MenuContextValue>(
    () => ({
      open,
      onOpenChange: setOpen,
      onOpenToggle: () => setOpen(!open),
      contentId: `${baseId}-content`,
      triggerId: `${baseId}-trigger`,
      triggerRef,
      openIntentRef,
    }),
    [open, setOpen, baseId],
  );
  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}
MenuRoot.displayName = 'Menu.Root';

/* -------------------------------------------------------------------------------------------------
 * Trigger
 * -----------------------------------------------------------------------------------------------*/

export type MenuTriggerProps = React.ComponentPropsWithoutRef<'button'> & AsChildProps;

export const MenuTrigger = React.forwardRef<HTMLButtonElement, MenuTriggerProps>(
  ({ asChild, onClick, onKeyDown, ...props }, forwardedRef) => {
    const context = useMenuContext('Trigger');
    const ref = useComposedRefs(forwardedRef, context.triggerRef);
    const Comp = getComp('button', asChild);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>): void => {
      // Enter·Space는 버튼의 기본 click으로 열린다.
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      event.preventDefault();
      context.openIntentRef.current = event.key === 'ArrowUp' ? 'last' : 'first';
      context.onOpenChange(true);
    };

    return (
      <Comp
        type={asChild ? undefined : 'button'}
        id={context.triggerId}
        aria-haspopup="menu"
        aria-expanded={context.open}
        aria-controls={context.open ? context.contentId : undefined}
        data-state={getState(context.open)}
        {...props}
        ref={ref}
        onClick={composeEventHandlers(onClick, () => {
          context.openIntentRef.current = 'first';
          context.onOpenToggle();
        })}
        onKeyDown={composeEventHandlers(onKeyDown, handleKeyDown)}
      />
    );
  },
);
MenuTrigger.displayName = 'Menu.Trigger';

/* -------------------------------------------------------------------------------------------------
 * Portal
 * -----------------------------------------------------------------------------------------------*/

export interface MenuPortalProps {
  children?: React.ReactNode;
  /** 포털을 붙일 대상. 기본값은 document.body. */
  container?: Element | DocumentFragment | null;
  /** 닫혀 있어도 자식을 렌더한다. */
  forceMount?: boolean;
}

export function MenuPortal({ children, container, forceMount }: MenuPortalProps) {
  const context = useMenuContext('Portal');
  if (!(context.open || forceMount)) return null;
  return <Portal container={container}>{children}</Portal>;
}
MenuPortal.displayName = 'Menu.Portal';

/* -------------------------------------------------------------------------------------------------
 * Content
 * -----------------------------------------------------------------------------------------------*/

export type MenuPointerDownOutsideEvent = CustomEvent<{ originalEvent: PointerEvent }>;

export interface MenuContentProps extends React.ComponentPropsWithoutRef<'div'>, AsChildProps {
  /** 닫혀 있어도 렌더한다. */
  forceMount?: boolean;
  /** 트리거 기준 배치 방향. 공간이 부족하면 반대편으로 뒤집힌다. 기본값 bottom. */
  side?: Side;
  /** 배치 방향 축에 대한 정렬. 기본값 start. */
  align?: Align;
  /** 트리거와의 간격(px). 기본값 4. */
  sideOffset?: number;
  /** 열릴 때 자동 포커스 직전에 호출. preventDefault()로 기본 포커스 이동을 막을 수 있다. */
  onOpenAutoFocus?: (event: Event) => void;
  /** 닫힐 때 트리거로 포커스를 되돌리기 직전에 호출. preventDefault()로 막을 수 있다. */
  onCloseAutoFocus?: (event: Event) => void;
  /** Esc 키를 눌렀을 때 호출. preventDefault()로 닫힘을 막을 수 있다. */
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  /** Content 바깥에서 포인터를 눌렀을 때 호출. preventDefault()로 닫힘을 막을 수 있다. */
  onPointerDownOutside?: (event: MenuPointerDownOutsideEvent) => void;
}

const OPEN_AUTO_FOCUS = 'logicui.menu.openAutoFocus';
const CLOSE_AUTO_FOCUS = 'logicui.menu.closeAutoFocus';
const POINTER_DOWN_OUTSIDE = 'logicui.menu.pointerDownOutside';
const ITEM_SELECT = 'logicui.menu.itemSelect';

const ITEM_SELECTOR = '[role="menuitem"],[role="menuitemcheckbox"],[role="menuitemradio"]';
const TYPEAHEAD_RESET_MS = 1000;

/** 비활성이 아닌 항목만 DOM 순서대로 돌려준다. */
const getItems = (content: HTMLElement): HTMLElement[] =>
  Array.from(content.querySelectorAll<HTMLElement>(ITEM_SELECTOR)).filter((item) => item.getAttribute('aria-disabled') !== 'true');

export const MenuContent = React.forwardRef<HTMLDivElement, MenuContentProps>(({ forceMount, ...props }, forwardedRef) => {
  const context = useMenuContext('Content');
  if (!(context.open || forceMount)) return null;
  return <MenuContentImpl {...props} ref={forwardedRef} />;
});
MenuContent.displayName = 'Menu.Content';

type MenuContentImplProps = Omit<MenuContentProps, 'forceMount'>;

const MenuContentImpl = React.forwardRef<HTMLDivElement, MenuContentImplProps>(
  (
    {
      asChild,
      side = 'bottom',
      align = 'start',
      sideOffset = 4,
      onOpenAutoFocus,
      onCloseAutoFocus,
      onEscapeKeyDown,
      onPointerDownOutside,
      onKeyDown,
      ...props
    },
    forwardedRef,
  ) => {
    const context = useMenuContext('Content');
    const { open, onOpenChange, triggerRef, openIntentRef } = context;
    const contentRef = React.useRef<HTMLDivElement | null>(null);
    const ref = useComposedRefs(forwardedRef, contentRef);
    const layerRef = React.useRef({});
    const typeahead = React.useRef({ buffer: '', timer: 0 });
    const [labelledBy, setLabelledBy] = React.useState<string | undefined>(undefined);

    useFloatingPosition(triggerRef, contentRef, { side, align, sideOffset });

    // 소비자가 트리거에 id를 직접 줬다면 그 id를 따라간다.
    useIsomorphicLayoutEffect(() => {
      setLabelledBy(triggerRef.current?.id || undefined);
    }, [triggerRef]);

    // 콜백은 ref로 최신값만 유지해 이펙트가 재실행되지 않도록 한다.
    const callbacks = React.useRef({ onOpenAutoFocus, onCloseAutoFocus, onEscapeKeyDown, onPointerDownOutside, onOpenChange });
    callbacks.current = { onOpenAutoFocus, onCloseAutoFocus, onEscapeKeyDown, onPointerDownOutside, onOpenChange };

    React.useEffect(() => {
      const content = contentRef.current;
      if (!content || !open) return;
      const doc = content.ownerDocument;
      const layer = layerRef.current;
      layerStack.push(layer);

      const openEvent = new Event(OPEN_AUTO_FOCUS, { cancelable: true });
      callbacks.current.onOpenAutoFocus?.(openEvent);
      if (!openEvent.defaultPrevented) {
        const items = getItems(content);
        const target = openIntentRef.current === 'last' ? items[items.length - 1] : items[0];
        focus(target ?? content);
      }

      const handleKeyDown = (event: KeyboardEvent): void => {
        if (event.key !== 'Escape' || !layerStack.isTop(layer)) return;
        callbacks.current.onEscapeKeyDown?.(event);
        if (!event.defaultPrevented) callbacks.current.onOpenChange(false);
      };

      const handlePointerDown = (event: PointerEvent): void => {
        const target = event.target as Node | null;
        if (!target || content.contains(target) || !layerStack.isTop(layer)) return;
        // 트리거 클릭은 토글이 담당한다.
        if (triggerRef.current?.contains(target)) return;
        const outsideEvent: MenuPointerDownOutsideEvent = new CustomEvent(POINTER_DOWN_OUTSIDE, {
          cancelable: true,
          detail: { originalEvent: event },
        });
        callbacks.current.onPointerDownOutside?.(outsideEvent);
        if (!outsideEvent.defaultPrevented) callbacks.current.onOpenChange(false);
      };

      doc.addEventListener('keydown', handleKeyDown);
      doc.addEventListener('pointerdown', handlePointerDown);
      const typeaheadState = typeahead.current;

      return () => {
        doc.removeEventListener('keydown', handleKeyDown);
        doc.removeEventListener('pointerdown', handlePointerDown);
        window.clearTimeout(typeaheadState.timer);
        layerStack.remove(layer);

        const closeEvent = new Event(CLOSE_AUTO_FOCUS, { cancelable: true });
        callbacks.current.onCloseAutoFocus?.(closeEvent);
        if (closeEvent.defaultPrevented) return;
        // 포커스가 메뉴 안에 있었거나 갈 곳을 잃은 경우에만 트리거로 돌려준다.
        // 바깥 클릭으로 다른 요소가 포커스를 받았다면 빼앗지 않는다.
        const active = doc.activeElement;
        if (!active || active === doc.body || content.contains(active)) focus(triggerRef.current);
      };
    }, [open, triggerRef, openIntentRef]);

    const moveFocus = (content: HTMLElement, key: string): void => {
      const items = getItems(content);
      if (items.length === 0) return;
      const current = items.indexOf(content.ownerDocument.activeElement as HTMLElement);
      let next: number;
      if (key === 'Home') next = 0;
      else if (key === 'End') next = items.length - 1;
      else if (key === 'ArrowDown') next = current === -1 ? 0 : (current + 1) % items.length;
      else next = current === -1 ? items.length - 1 : (current - 1 + items.length) % items.length;
      focus(items[next]);
    };

    // 입력한 글자로 시작하는 항목으로 이동한다. 같은 글자를 반복하면 일치하는 항목을 순환한다.
    const handleTypeahead = (content: HTMLElement, key: string): void => {
      const state = typeahead.current;
      state.buffer += key.toLowerCase();
      window.clearTimeout(state.timer);
      state.timer = window.setTimeout(() => {
        state.buffer = '';
      }, TYPEAHEAD_RESET_MS);

      const items = getItems(content);
      const current = items.indexOf(content.ownerDocument.activeElement as HTMLElement);
      const isRepeat = state.buffer.length > 1 && [...state.buffer].every((char) => char === state.buffer[0]);
      const search = isRepeat ? state.buffer[0]! : state.buffer;
      // 한 글자(또는 반복)는 현재 항목 다음부터, 여러 글자는 현재 항목부터 찾는다.
      const start = search.length === 1 ? current + 1 : Math.max(current, 0);
      const ordered = [...items.slice(start), ...items.slice(0, start)];
      const match = ordered.find((item) => (item.textContent ?? '').trim().toLowerCase().startsWith(search));
      focus(match);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
      const content = contentRef.current;
      const target = event.target as HTMLElement;
      if (!content || (target !== content && !target.closest(ITEM_SELECTOR))) return;

      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        moveFocus(content, event.key);
      } else if (event.key === 'Tab') {
        // 포커스가 포털 안에 있어 기본 Tab 이동은 문서 순서와 맞지 않는다. 닫고 트리거로 돌아간다.
        event.preventDefault();
        onOpenChange(false);
      } else if (event.key === 'Enter' || (event.key === ' ' && typeahead.current.buffer === '')) {
        const item = target.closest<HTMLElement>(ITEM_SELECTOR);
        if (!item) return;
        event.preventDefault();
        item.click();
      } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        handleTypeahead(content, event.key);
      }
    };

    const Comp = getComp('div', asChild);
    return (
      <Comp
        role="menu"
        id={context.contentId}
        tabIndex={-1}
        aria-orientation="vertical"
        aria-labelledby={labelledBy}
        data-state={getState(open)}
        data-side={side}
        data-align={align}
        {...props}
        ref={ref}
        onKeyDown={composeEventHandlers(onKeyDown, handleKeyDown)}
      />
    );
  },
);
MenuContentImpl.displayName = 'Menu.ContentImpl';

/* -------------------------------------------------------------------------------------------------
 * Item (공통 구현)
 * -----------------------------------------------------------------------------------------------*/

interface MenuItemImplProps extends Omit<React.ComponentPropsWithoutRef<'div'>, 'onSelect'>, AsChildProps {
  /** 비활성화. 포커스 이동과 선택에서 제외된다. */
  disabled?: boolean;
  /** 선택(클릭·Enter·Space)됐을 때 호출. preventDefault()로 메뉴가 닫히지 않게 할 수 있다. */
  onSelect?: (event: Event) => void;
}

const MenuItemImpl = React.forwardRef<HTMLDivElement, MenuItemImplProps & { role: string }>(
  ({ asChild, disabled, onSelect, onClick, onPointerMove, onPointerLeave, role, ...props }, forwardedRef) => {
    const context = useMenuContext('Item');
    const itemRef = React.useRef<HTMLDivElement | null>(null);
    const ref = useComposedRefs(forwardedRef, itemRef);

    const handleClick = (): void => {
      if (disabled) return;
      const selectEvent = new Event(ITEM_SELECT, { cancelable: true });
      onSelect?.(selectEvent);
      if (!selectEvent.defaultPrevented) context.onOpenChange(false);
    };

    const Comp = getComp('div', asChild);
    return (
      <Comp
        role={role}
        tabIndex={-1}
        aria-disabled={disabled ? true : undefined}
        data-disabled={disabled ? '' : undefined}
        {...props}
        ref={ref}
        onClick={composeEventHandlers(onClick, handleClick)}
        // 마우스를 올린 항목이 포커스를 가져, 이어서 키보드로 움직일 수 있게 한다.
        onPointerMove={composeEventHandlers(onPointerMove, (event) => {
          if (disabled || event.pointerType === 'touch') return;
          const el = itemRef.current;
          if (el && el.ownerDocument.activeElement !== el) focus(el);
        })}
        onPointerLeave={composeEventHandlers(onPointerLeave, () => {
          const content = itemRef.current?.closest<HTMLElement>('[role="menu"]');
          if (content && itemRef.current === content.ownerDocument.activeElement) focus(content);
        })}
      />
    );
  },
);
MenuItemImpl.displayName = 'Menu.ItemImpl';

/* -------------------------------------------------------------------------------------------------
 * Item
 * -----------------------------------------------------------------------------------------------*/

export type MenuItemProps = MenuItemImplProps;

export const MenuItem = React.forwardRef<HTMLDivElement, MenuItemProps>((props, forwardedRef) => (
  <MenuItemImpl {...props} role="menuitem" ref={forwardedRef} />
));
MenuItem.displayName = 'Menu.Item';

/* -------------------------------------------------------------------------------------------------
 * CheckboxItem
 * -----------------------------------------------------------------------------------------------*/

export interface MenuCheckboxItemProps extends MenuItemImplProps {
  /** 제어 모드의 체크 상태. */
  checked?: boolean;
  /** 비제어 모드의 초기 체크 상태. */
  defaultChecked?: boolean;
  /** 체크 상태가 바뀌어야 할 때 호출된다. */
  onCheckedChange?: (checked: boolean) => void;
}

export const MenuCheckboxItem = React.forwardRef<HTMLDivElement, MenuCheckboxItemProps>(
  ({ checked: checkedProp, defaultChecked = false, onCheckedChange, onSelect, ...props }, forwardedRef) => {
    const [checked, setChecked] = useControllableState({ prop: checkedProp, defaultProp: defaultChecked, onChange: onCheckedChange });
    return (
      <MenuItemImpl
        {...props}
        role="menuitemcheckbox"
        aria-checked={checked}
        data-state={checked ? 'checked' : 'unchecked'}
        ref={forwardedRef}
        // 상태는 항상 바뀌고, 소비자의 preventDefault()는 메뉴 닫힘만 막는다.
        onSelect={(event) => {
          onSelect?.(event);
          setChecked(!checked);
        }}
      />
    );
  },
);
MenuCheckboxItem.displayName = 'Menu.CheckboxItem';

/* -------------------------------------------------------------------------------------------------
 * RadioGroup / RadioItem
 * -----------------------------------------------------------------------------------------------*/

interface MenuRadioGroupContextValue {
  value: string | undefined;
  onValueChange: (value: string) => void;
}

const MenuRadioGroupContext = React.createContext<MenuRadioGroupContextValue | null>(null);

export interface MenuRadioGroupProps extends React.ComponentPropsWithoutRef<'div'>, AsChildProps {
  /** 제어 모드의 선택 값. */
  value?: string;
  /** 비제어 모드의 초기 선택 값. */
  defaultValue?: string;
  /** 선택 값이 바뀌어야 할 때 호출된다. */
  onValueChange?: (value: string) => void;
}

export const MenuRadioGroup = React.forwardRef<HTMLDivElement, MenuRadioGroupProps>(
  ({ asChild, value: valueProp, defaultValue, onValueChange, ...props }, forwardedRef) => {
    const [value, setValue] = useControllableState<string | undefined>({
      prop: valueProp,
      defaultProp: defaultValue,
      onChange: (next) => next !== undefined && onValueChange?.(next),
    });
    const context = React.useMemo<MenuRadioGroupContextValue>(() => ({ value, onValueChange: setValue }), [value, setValue]);
    const Comp = getComp('div', asChild);
    return (
      <MenuRadioGroupContext.Provider value={context}>
        <Comp role="group" {...props} ref={forwardedRef} />
      </MenuRadioGroupContext.Provider>
    );
  },
);
MenuRadioGroup.displayName = 'Menu.RadioGroup';

export interface MenuRadioItemProps extends MenuItemImplProps {
  /** 이 항목이 나타내는 값. 그룹의 value와 같으면 선택된 상태다. */
  value: string;
}

export const MenuRadioItem = React.forwardRef<HTMLDivElement, MenuRadioItemProps>(
  ({ value, onSelect, ...props }, forwardedRef) => {
    const group = React.useContext(MenuRadioGroupContext);
    if (!group) {
      throw new Error('<Menu.RadioItem>은(는) <Menu.RadioGroup> 안에서만 사용할 수 있습니다.');
    }
    const checked = group.value === value;
    return (
      <MenuItemImpl
        {...props}
        role="menuitemradio"
        aria-checked={checked}
        data-state={checked ? 'checked' : 'unchecked'}
        ref={forwardedRef}
        onSelect={(event) => {
          onSelect?.(event);
          group.onValueChange(value);
        }}
      />
    );
  },
);
MenuRadioItem.displayName = 'Menu.RadioItem';

/* -------------------------------------------------------------------------------------------------
 * Separator
 * -----------------------------------------------------------------------------------------------*/

export type MenuSeparatorProps = React.ComponentPropsWithoutRef<'div'> & AsChildProps;

export const MenuSeparator = React.forwardRef<HTMLDivElement, MenuSeparatorProps>(({ asChild, ...props }, forwardedRef) => {
  const Comp = getComp('div', asChild);
  return <Comp role="separator" aria-orientation="horizontal" {...props} ref={forwardedRef} />;
});
MenuSeparator.displayName = 'Menu.Separator';

/* -------------------------------------------------------------------------------------------------
 * 합성 컴포넌트용 짧은 이름
 * -----------------------------------------------------------------------------------------------*/

export {
  MenuRoot as Root,
  MenuTrigger as Trigger,
  MenuPortal as Portal,
  MenuContent as Content,
  MenuItem as Item,
  MenuCheckboxItem as CheckboxItem,
  MenuRadioGroup as RadioGroup,
  MenuRadioItem as RadioItem,
  MenuSeparator as Separator,
};
