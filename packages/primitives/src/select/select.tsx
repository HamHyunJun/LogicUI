import * as React from 'react';
import { composeEventHandlers } from '../shared/compose-event-handlers';
import { useComposedRefs } from '../shared/compose-refs';
import { layerStack } from '../shared/layer-stack';
import { Portal } from '../shared/portal';
import type { Align, Side } from '../shared/position';
import { getComp, type AsChildProps } from '../shared/primitive';
import { useControllableState } from '../shared/use-controllable-state';
import { useFloatingPosition } from '../shared/use-floating-position';
import { useIsomorphicLayoutEffect } from '../shared/use-isomorphic-layout-effect';

/*
 * WAI-ARIA APG Select-Only Combobox 패턴.
 * DOM 포커스는 항상 트리거(role="combobox")에 있고, 목록에서 가리키는 옵션은 aria-activedescendant로 알린다.
 * 닫혀 있어도 선택된 옵션의 라벨을 보여 줘야 해서 옵션을 숨긴 채 항상 마운트한다(Content가 hidden).
 * shortcut: 그룹·라벨·스크롤 버튼은 없다, 필요해지면 Select.Group/Label을 추가한다.
 */

const OPTION_SELECTOR = '[role="option"]';
const TYPEAHEAD_RESET_MS = 1000;
const PAGE_SIZE = 10;

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/

interface ActiveOption {
  value: string;
  id: string;
}

interface SelectContextValue {
  value: string | undefined;
  onValueChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled: boolean;
  required: boolean;
  name: string | undefined;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  triggerId: string;
  contentId: string;
  labels: Record<string, string>;
  registerLabel: (value: string, label: string) => void;
  active: ActiveOption | undefined;
  setActive: (active: ActiveOption | undefined) => void;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelectContext(part: string): SelectContextValue {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error(`<Select.${part}>은(는) <Select.Root> 안에서만 사용할 수 있습니다.`);
  }
  return context;
}

/** 비활성이 아닌 옵션 요소를 DOM 순서대로 돌려준다. 닫혀 있어도 마운트되어 있다. */
const getOptions = (content: HTMLElement | null): HTMLElement[] =>
  Array.from(content?.querySelectorAll<HTMLElement>(OPTION_SELECTOR) ?? []).filter((el) => el.getAttribute('aria-disabled') !== 'true');

const toActive = (el: HTMLElement | undefined): ActiveOption | undefined =>
  el ? { value: el.getAttribute('data-value') ?? '', id: el.id } : undefined;

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/

export interface SelectRootProps {
  children?: React.ReactNode;
  /** 제어 모드의 선택 값. */
  value?: string;
  /** 비제어 모드의 초기 선택 값. */
  defaultValue?: string;
  /** 선택 값이 바뀌어야 할 때 호출된다. */
  onValueChange?: (value: string) => void;
  /** 제어 모드의 열림 상태. */
  open?: boolean;
  /** 비제어 모드의 초기 열림 상태. */
  defaultOpen?: boolean;
  /** 열림 상태가 바뀌어야 할 때 호출된다. */
  onOpenChange?: (open: boolean) => void;
  /** 비활성화. */
  disabled?: boolean;
  /** aria-required를 붙인다. */
  required?: boolean;
  /** 폼 제출용 이름. 지정하면 선택 값을 숨은 input으로 제출한다. */
  name?: string;
}

export function SelectRoot({
  children,
  value: valueProp,
  defaultValue,
  onValueChange,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  required = false,
  name,
}: SelectRootProps) {
  const [value, setValue] = useControllableState<string | undefined>({
    prop: valueProp,
    defaultProp: defaultValue,
    onChange: (next) => next !== undefined && onValueChange?.(next),
  });
  const [open, setOpen] = useControllableState({ prop: openProp, defaultProp: defaultOpen, onChange: onOpenChange });
  const [labels, setLabels] = React.useState<Record<string, string>>({});
  const [active, setActive] = React.useState<ActiveOption | undefined>(undefined);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const baseId = React.useId();

  const registerLabel = React.useCallback((optionValue: string, label: string) => {
    setLabels((prev) => (prev[optionValue] === label ? prev : { ...prev, [optionValue]: label }));
  }, []);

  const context = React.useMemo<SelectContextValue>(
    () => ({
      value,
      onValueChange: setValue,
      open,
      onOpenChange: setOpen,
      disabled,
      required,
      name,
      triggerRef,
      contentRef,
      triggerId: `${baseId}-trigger`,
      contentId: `${baseId}-content`,
      labels,
      registerLabel,
      active,
      setActive,
    }),
    [value, setValue, open, setOpen, disabled, required, name, baseId, labels, registerLabel, active],
  );
  return (
    <SelectContext.Provider value={context}>
      {children}
      {name !== undefined && <input type="hidden" name={name} value={value ?? ''} disabled={disabled} />}
    </SelectContext.Provider>
  );
}
SelectRoot.displayName = 'Select.Root';

/* -------------------------------------------------------------------------------------------------
 * Trigger
 * -----------------------------------------------------------------------------------------------*/

export type SelectTriggerProps = Omit<React.ComponentPropsWithoutRef<'button'>, 'value'> & AsChildProps;

export const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ asChild, onClick, onKeyDown, disabled: disabledProp, ...props }, forwardedRef) => {
    const ctx = useSelectContext('Trigger');
    const ref = useComposedRefs(forwardedRef, ctx.triggerRef);
    const disabled = ctx.disabled || !!disabledProp;
    const typeahead = React.useRef({ buffer: '', timer: 0 });
    React.useEffect(() => {
      const state = typeahead.current;
      return () => window.clearTimeout(state.timer);
    }, []);

    /** 열면서 가리킬 옵션을 정한다: 선택된 옵션이 있으면 그것, 없으면 처음(또는 마지막). */
    const openAt = (intent: 'first' | 'last'): void => {
      const options = getOptions(ctx.contentRef.current);
      const selected = options.find((el) => el.getAttribute('data-value') === ctx.value);
      ctx.setActive(toActive(selected ?? (intent === 'last' ? options[options.length - 1] : options[0])));
      ctx.onOpenChange(true);
    };

    const moveActive = (to: 'first' | 'last' | number): void => {
      const options = getOptions(ctx.contentRef.current);
      if (options.length === 0) return;
      const current = options.findIndex((el) => el.id === ctx.active?.id);
      let next: number;
      if (to === 'first') next = 0;
      else if (to === 'last') next = options.length - 1;
      else next = Math.min(options.length - 1, Math.max(0, (current === -1 ? 0 : current) + to));
      ctx.setActive(toActive(options[next]));
    };

    const commitActive = (): void => {
      if (ctx.active) ctx.onValueChange(ctx.active.value);
      ctx.onOpenChange(false);
    };

    // 입력한 글자로 시작하는 옵션을 가리킨다. 같은 글자를 반복하면 일치하는 옵션을 순환한다.
    const handleTypeahead = (key: string): void => {
      const state = typeahead.current;
      state.buffer += key.toLowerCase();
      window.clearTimeout(state.timer);
      state.timer = window.setTimeout(() => {
        state.buffer = '';
      }, TYPEAHEAD_RESET_MS);

      const options = getOptions(ctx.contentRef.current);
      const current = options.findIndex((el) => el.id === ctx.active?.id || (!ctx.active && el.getAttribute('data-value') === ctx.value));
      const isRepeat = state.buffer.length > 1 && [...state.buffer].every((c) => c === state.buffer[0]);
      const search = isRepeat ? state.buffer[0]! : state.buffer;
      const start = search.length === 1 ? current + 1 : Math.max(current, 0);
      const ordered = [...options.slice(start), ...options.slice(0, start)];
      const match = ordered.find((el) => (el.textContent ?? '').trim().toLowerCase().startsWith(search));
      if (!match) return;
      ctx.setActive(toActive(match));
      if (!ctx.open) ctx.onOpenChange(true);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>): void => {
      if (disabled) return;
      const { key } = event;
      const printable = key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;

      if (!ctx.open) {
        if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Enter' || (key === ' ' && typeahead.current.buffer === '')) {
          event.preventDefault();
          openAt(key === 'ArrowUp' ? 'last' : 'first');
        } else if (printable) {
          event.preventDefault();
          handleTypeahead(key);
        }
        return;
      }

      if (key === 'ArrowDown' && event.altKey) return; // 이미 열려 있다
      if (key === 'ArrowUp' && event.altKey) {
        event.preventDefault();
        commitActive();
      } else if (key === 'ArrowDown') {
        event.preventDefault();
        moveActive(1);
      } else if (key === 'ArrowUp') {
        event.preventDefault();
        moveActive(-1);
      } else if (key === 'Home') {
        event.preventDefault();
        moveActive('first');
      } else if (key === 'End') {
        event.preventDefault();
        moveActive('last');
      } else if (key === 'PageDown') {
        event.preventDefault();
        moveActive(PAGE_SIZE);
      } else if (key === 'PageUp') {
        event.preventDefault();
        moveActive(-PAGE_SIZE);
      } else if (key === 'Enter' || (key === ' ' && typeahead.current.buffer === '')) {
        event.preventDefault();
        commitActive();
      } else if (key === 'Tab') {
        commitActive(); // 포커스는 기본 동작대로 다음 요소로 간다.
      } else if (printable) {
        event.preventDefault();
        handleTypeahead(key);
      }
    };

    const Comp = getComp('button', asChild);
    return (
      <Comp
        type={asChild ? undefined : 'button'}
        role="combobox"
        id={ctx.triggerId}
        aria-haspopup="listbox"
        aria-expanded={ctx.open}
        aria-controls={ctx.open ? ctx.contentId : undefined}
        aria-activedescendant={ctx.open ? ctx.active?.id : undefined}
        aria-autocomplete="none"
        aria-required={ctx.required || undefined}
        disabled={disabled}
        data-state={ctx.open ? 'open' : 'closed'}
        data-disabled={disabled ? '' : undefined}
        data-placeholder={ctx.value === undefined ? '' : undefined}
        {...props}
        ref={ref}
        onClick={composeEventHandlers(onClick, (event: React.MouseEvent) => {
          // 키보드로 인한 click(detail 0)은 keydown에서 이미 처리했다.
          if (event.detail === 0) return;
          if (ctx.open) ctx.onOpenChange(false);
          else openAt('first');
        })}
        onKeyDown={composeEventHandlers(onKeyDown, handleKeyDown)}
      />
    );
  },
);
SelectTrigger.displayName = 'Select.Trigger';

/* -------------------------------------------------------------------------------------------------
 * Value
 * -----------------------------------------------------------------------------------------------*/

export interface SelectValueProps extends Omit<React.ComponentPropsWithoutRef<'span'>, 'children'>, AsChildProps {
  /** 선택된 값이 없을 때 보여 줄 내용. */
  placeholder?: React.ReactNode;
  /** 직접 지정하면 선택된 옵션의 라벨 대신 이 내용을 보여 준다. */
  children?: React.ReactNode;
}

/** 트리거 안에 선택된 옵션의 라벨(없으면 placeholder)을 보여 준다. */
export const SelectValue = React.forwardRef<HTMLSpanElement, SelectValueProps>(({ asChild, placeholder, children, ...props }, forwardedRef) => {
  const ctx = useSelectContext('Value');
  const label = ctx.value === undefined ? undefined : (ctx.labels[ctx.value] ?? ctx.value);
  const Comp = getComp('span', asChild);
  return (
    <Comp data-placeholder={ctx.value === undefined ? '' : undefined} {...props} ref={forwardedRef}>
      {children ?? label ?? placeholder}
    </Comp>
  );
});
SelectValue.displayName = 'Select.Value';

/* -------------------------------------------------------------------------------------------------
 * Portal
 * -----------------------------------------------------------------------------------------------*/

export interface SelectPortalProps {
  children?: React.ReactNode;
  /** 포털을 붙일 대상. 기본값은 document.body. */
  container?: Element | DocumentFragment | null;
}

/** 닫혀 있어도 자식을 렌더한다(옵션 라벨을 Value에 보여 주기 위해). Content가 hidden으로 숨긴다. */
export function SelectPortal({ children, container }: SelectPortalProps) {
  useSelectContext('Portal');
  return <Portal container={container}>{children}</Portal>;
}
SelectPortal.displayName = 'Select.Portal';

/* -------------------------------------------------------------------------------------------------
 * Content
 * -----------------------------------------------------------------------------------------------*/

export type SelectPointerDownOutsideEvent = CustomEvent<{ originalEvent: PointerEvent }>;

export interface SelectContentProps extends React.ComponentPropsWithoutRef<'div'>, AsChildProps {
  /** 트리거 기준 배치 방향. 공간이 부족하면 반대편으로 뒤집힌다. 기본값 bottom. */
  side?: Side;
  /** 배치 방향 축에 대한 정렬. 기본값 start. */
  align?: Align;
  /** 트리거와의 간격(px). 기본값 4. */
  sideOffset?: number;
  /** Esc 키를 눌렀을 때 호출. preventDefault()로 닫힘을 막을 수 있다. */
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  /** Content 바깥에서 포인터를 눌렀을 때 호출. preventDefault()로 닫힘을 막을 수 있다. */
  onPointerDownOutside?: (event: SelectPointerDownOutsideEvent) => void;
}

const POINTER_DOWN_OUTSIDE = 'logicui.select.pointerDownOutside';

export const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  (
    { asChild, side = 'bottom', align = 'start', sideOffset = 4, onEscapeKeyDown, onPointerDownOutside, onMouseDown, ...props },
    forwardedRef,
  ) => {
    const ctx = useSelectContext('Content');
    const { open, onOpenChange, triggerRef, contentRef, active, setActive, value } = ctx;
    const ref = useComposedRefs(forwardedRef, contentRef);
    const layerRef = React.useRef({});
    const [labelProps, setLabelProps] = React.useState<{ 'aria-labelledby'?: string; 'aria-label'?: string }>({});

    useFloatingPosition(triggerRef, contentRef, { side, align, sideOffset }, open);

    const callbacks = React.useRef({ onEscapeKeyDown, onPointerDownOutside, onOpenChange });
    callbacks.current = { onEscapeKeyDown, onPointerDownOutside, onOpenChange };

    // 목록의 이름은 트리거가 가진 이름(aria-labelledby / aria-label)을 따라간다. 둘 다 없으면 트리거 자체를 가리킨다.
    useIsomorphicLayoutEffect(() => {
      const trigger = triggerRef.current;
      const labelledBy = trigger?.getAttribute('aria-labelledby');
      const label = trigger?.getAttribute('aria-label');
      const next = labelledBy ? { 'aria-labelledby': labelledBy } : label ? { 'aria-label': label } : {};
      // 렌더마다 도는 효과라서 같은 값이면 상태를 바꾸지 않는다(무한 렌더 방지).
      setLabelProps((prev) => (prev['aria-labelledby'] === next['aria-labelledby'] && prev['aria-label'] === next['aria-label'] ? prev : next));
    });

    // 열릴 때(키보드 외의 방법으로 열린 경우 포함) 가리키는 옵션이 없으면 선택된 옵션, 없으면 첫 옵션을 가리킨다.
    useIsomorphicLayoutEffect(() => {
      const content = contentRef.current;
      if (!open || !content) return;
      content.style.setProperty('--logicui-select-trigger-width', `${triggerRef.current?.offsetWidth ?? 0}px`);
      if (!active) {
        const options = getOptions(content);
        setActive(toActive(options.find((el) => el.getAttribute('data-value') === value) ?? options[0]));
      }
    }, [open]); // 열릴 때 한 번만 정한다.

    // 가리키는 옵션이 보이도록 스크롤한다.
    React.useEffect(() => {
      if (!open || !active) return;
      contentRef.current?.ownerDocument.getElementById(active.id)?.scrollIntoView?.({ block: 'nearest' });
    }, [open, active, contentRef]);

    React.useEffect(() => {
      const content = contentRef.current;
      if (!open || !content) return;
      const doc = content.ownerDocument;
      const layer = layerRef.current;
      layerStack.push(layer);

      const handleKeyDown = (event: KeyboardEvent): void => {
        if (event.key !== 'Escape' || !layerStack.isTop(layer)) return;
        callbacks.current.onEscapeKeyDown?.(event);
        if (!event.defaultPrevented) callbacks.current.onOpenChange(false);
      };
      const handlePointerDown = (event: PointerEvent): void => {
        const target = event.target as Node | null;
        if (!target || content.contains(target) || triggerRef.current?.contains(target) || !layerStack.isTop(layer)) return;
        const outsideEvent: SelectPointerDownOutsideEvent = new CustomEvent(POINTER_DOWN_OUTSIDE, { cancelable: true, detail: { originalEvent: event } });
        callbacks.current.onPointerDownOutside?.(outsideEvent);
        if (!outsideEvent.defaultPrevented) callbacks.current.onOpenChange(false);
      };
      doc.addEventListener('keydown', handleKeyDown);
      doc.addEventListener('pointerdown', handlePointerDown);
      return () => {
        doc.removeEventListener('keydown', handleKeyDown);
        doc.removeEventListener('pointerdown', handlePointerDown);
        layerStack.remove(layer);
      };
    }, [open, contentRef, triggerRef]);

    const Comp = getComp('div', asChild);
    return (
      <Comp
        role="listbox"
        id={ctx.contentId}
        aria-labelledby={labelProps['aria-label'] || labelProps['aria-labelledby'] ? labelProps['aria-labelledby'] : ctx.triggerId}
        aria-label={labelProps['aria-label']}
        hidden={!open}
        data-state={open ? 'open' : 'closed'}
        data-side={side}
        data-align={align}
        {...props}
        ref={ref}
        // 옵션을 눌러도 포커스가 트리거에서 떠나지 않게 한다.
        onMouseDown={composeEventHandlers(onMouseDown, (event: React.MouseEvent) => event.preventDefault())}
      />
    );
  },
);
SelectContent.displayName = 'Select.Content';

/* -------------------------------------------------------------------------------------------------
 * Item
 * -----------------------------------------------------------------------------------------------*/

export interface SelectItemProps extends Omit<React.ComponentPropsWithoutRef<'div'>, 'onSelect'>, AsChildProps {
  /** 이 옵션이 나타내는 값. */
  value: string;
  /** 비활성화. 포커스 이동과 선택에서 제외된다. */
  disabled?: boolean;
  /** Value에 보여 줄 라벨. 기본은 옵션의 텍스트다. */
  textValue?: string;
}

export const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ asChild, value, disabled = false, textValue, onClick, onPointerMove, ...props }, forwardedRef) => {
    const ctx = useSelectContext('Item');
    const id = React.useId();
    const itemRef = React.useRef<HTMLDivElement | null>(null);
    const ref = useComposedRefs(forwardedRef, itemRef);
    const selected = ctx.value === value;
    const highlighted = ctx.active?.id === id;
    const { registerLabel } = ctx;

    useIsomorphicLayoutEffect(() => {
      registerLabel(value, textValue ?? itemRef.current?.textContent?.trim() ?? value);
    }, [value, textValue, registerLabel]);

    const Comp = getComp('div', asChild);
    return (
      <Comp
        role="option"
        id={id}
        aria-selected={selected}
        aria-disabled={disabled || undefined}
        data-value={value}
        data-state={selected ? 'checked' : 'unchecked'}
        data-highlighted={highlighted ? '' : undefined}
        data-disabled={disabled ? '' : undefined}
        {...props}
        ref={ref}
        onPointerMove={composeEventHandlers(onPointerMove, () => {
          if (!disabled && !highlighted) ctx.setActive({ value, id });
        })}
        onClick={composeEventHandlers(onClick, () => {
          if (disabled) return;
          ctx.onValueChange(value);
          ctx.onOpenChange(false);
        })}
      />
    );
  },
);
SelectItem.displayName = 'Select.Item';

export {
  SelectRoot as Root,
  SelectTrigger as Trigger,
  SelectValue as Value,
  SelectPortal as Portal,
  SelectContent as Content,
  SelectItem as Item,
};
