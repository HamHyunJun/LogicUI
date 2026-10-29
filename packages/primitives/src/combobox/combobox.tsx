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
 * WAI-ARIA APG Editable Combobox with List Autocomplete(수동 선택) 패턴.
 * DOM 포커스는 항상 입력창에 있고 가리키는 옵션은 aria-activedescendant로 알린다.
 * 헤드리스이므로 입력에 맞춰 옵션을 거르는 일은 소비자가 한다(inputValue를 보고 Item을 렌더).
 * shortcut: 그룹·로딩 상태·다중 선택은 없다, 필요해지면 Combobox.Group·multiple을 추가한다.
 */

const OPTION_SELECTOR = '[role="option"]';

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/

interface ActiveOption {
  value: string;
  id: string;
  label: string;
}

interface ComboboxContextValue {
  value: string | undefined;
  inputValue: string;
  onInputValueChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  contentId: string;
  active: ActiveOption | undefined;
  setActive: (active: ActiveOption | undefined) => void;
  /** 선택하고 입력창을 옵션의 라벨로 채운 뒤 닫는다. */
  select: (value: string, label: string) => void;
  /** 열릴 때 가리킬 옵션. 키보드(↓/↑)로 열면 처음/마지막, 입력으로 열면 없음. */
  openIntentRef: React.RefObject<'first' | 'last' | undefined>;
}

const ComboboxContext = React.createContext<ComboboxContextValue | null>(null);

function useComboboxContext(part: string): ComboboxContextValue {
  const context = React.useContext(ComboboxContext);
  if (!context) {
    throw new Error(`<Combobox.${part}>은(는) <Combobox.Root> 안에서만 사용할 수 있습니다.`);
  }
  return context;
}

const getOptions = (content: HTMLElement | null): HTMLElement[] =>
  Array.from(content?.querySelectorAll<HTMLElement>(OPTION_SELECTOR) ?? []).filter((el) => el.getAttribute('aria-disabled') !== 'true');

const toActive = (el: HTMLElement | undefined): ActiveOption | undefined =>
  el ? { value: el.getAttribute('data-value') ?? '', id: el.id, label: el.getAttribute('data-text') ?? el.textContent?.trim() ?? '' } : undefined;

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/

export interface ComboboxRootProps {
  children?: React.ReactNode;
  /** 제어 모드의 선택 값. */
  value?: string;
  /** 비제어 모드의 초기 선택 값. */
  defaultValue?: string;
  /** 선택 값이 바뀌어야 할 때 호출된다. */
  onValueChange?: (value: string) => void;
  /** 제어 모드의 입력 텍스트. */
  inputValue?: string;
  /** 비제어 모드의 초기 입력 텍스트. */
  defaultInputValue?: string;
  /** 입력 텍스트가 바뀌어야 할 때(타이핑, 옵션 선택) 호출된다. 이 값으로 옵션을 거른다. */
  onInputValueChange?: (value: string) => void;
  /** 제어 모드의 열림 상태. */
  open?: boolean;
  /** 비제어 모드의 초기 열림 상태. */
  defaultOpen?: boolean;
  /** 열림 상태가 바뀌어야 할 때 호출된다. */
  onOpenChange?: (open: boolean) => void;
  /** 비활성화. */
  disabled?: boolean;
  /** 폼 제출용 이름. 선택 값이 숨은 input으로 제출된다(입력 텍스트가 아니라 value). */
  name?: string;
}

export function ComboboxRoot({
  children,
  value: valueProp,
  defaultValue,
  onValueChange,
  inputValue: inputValueProp,
  defaultInputValue = '',
  onInputValueChange,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  name,
}: ComboboxRootProps) {
  const [value, setValue] = useControllableState<string | undefined>({
    prop: valueProp,
    defaultProp: defaultValue,
    onChange: (next) => next !== undefined && onValueChange?.(next),
  });
  const [inputValue, setInputValue] = useControllableState({ prop: inputValueProp, defaultProp: defaultInputValue, onChange: onInputValueChange });
  const [open, setOpen] = useControllableState({ prop: openProp, defaultProp: defaultOpen, onChange: onOpenChange });
  const [active, setActive] = React.useState<ActiveOption | undefined>(undefined);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const openIntentRef = React.useRef<'first' | 'last' | undefined>(undefined);
  const contentId = `${React.useId()}-content`;

  const select = React.useCallback(
    (optionValue: string, label: string) => {
      setValue(optionValue);
      setInputValue(label);
      setActive(undefined);
      setOpen(false);
    },
    [setValue, setInputValue, setOpen],
  );

  const context = React.useMemo<ComboboxContextValue>(
    () => ({ value, inputValue, onInputValueChange: setInputValue, open, onOpenChange: setOpen, disabled, inputRef, contentRef, contentId, active, setActive, select, openIntentRef }),
    [value, inputValue, setInputValue, open, setOpen, disabled, contentId, active, select],
  );
  return (
    <ComboboxContext.Provider value={context}>
      {children}
      {name !== undefined && <input type="hidden" name={name} value={value ?? ''} disabled={disabled} />}
    </ComboboxContext.Provider>
  );
}
ComboboxRoot.displayName = 'Combobox.Root';

/* -------------------------------------------------------------------------------------------------
 * Input
 * -----------------------------------------------------------------------------------------------*/

export type ComboboxInputProps = Omit<React.ComponentPropsWithoutRef<'input'>, 'value' | 'defaultValue' | 'role'> & AsChildProps;

export const ComboboxInput = React.forwardRef<HTMLInputElement, ComboboxInputProps>(
  ({ asChild, onChange, onKeyDown, onBlur, disabled: disabledProp, ...props }, forwardedRef) => {
    const ctx = useComboboxContext('Input');
    const ref = useComposedRefs(forwardedRef, ctx.inputRef);
    const disabled = ctx.disabled || !!disabledProp;

    const moveActive = (delta: 1 | -1): void => {
      const options = getOptions(ctx.contentRef.current);
      if (options.length === 0) return;
      const current = options.findIndex((el) => el.id === ctx.active?.id);
      const next = current === -1 ? (delta === 1 ? 0 : options.length - 1) : Math.min(options.length - 1, Math.max(0, current + delta));
      ctx.setActive(toActive(options[next]));
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
      if (disabled) return;
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (!ctx.open) {
          ctx.openIntentRef.current = event.altKey ? undefined : 'first';
          ctx.onOpenChange(true);
        } else if (!event.altKey) moveActive(1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (event.altKey) ctx.onOpenChange(false);
        else if (!ctx.open) {
          ctx.openIntentRef.current = 'last';
          ctx.onOpenChange(true);
        } else moveActive(-1);
      } else if (event.key === 'Enter') {
        // 가리키는 옵션이 있을 때만 선택한다. 없으면 폼 제출 같은 기본 동작을 건드리지 않는다.
        if (ctx.open && ctx.active) {
          event.preventDefault();
          ctx.select(ctx.active.value, ctx.active.label);
        }
      } else if (event.key === 'Tab') {
        ctx.onOpenChange(false); // 선택하지 않고 닫는다(수동 선택).
      }
    };

    const Comp = getComp('input', asChild);
    return (
      <Comp
        type="text"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-expanded={ctx.open}
        aria-controls={ctx.open ? ctx.contentId : undefined}
        aria-activedescendant={ctx.open ? ctx.active?.id : undefined}
        disabled={disabled}
        data-state={ctx.open ? 'open' : 'closed'}
        data-disabled={disabled ? '' : undefined}
        {...props}
        value={ctx.inputValue}
        ref={ref}
        onChange={composeEventHandlers(onChange, (event: React.ChangeEvent<HTMLInputElement>) => {
          ctx.onInputValueChange(event.target.value);
          ctx.setActive(undefined);
          if (!ctx.open) {
            ctx.openIntentRef.current = undefined;
            ctx.onOpenChange(true);
          }
        })}
        onKeyDown={composeEventHandlers(onKeyDown, handleKeyDown)}
        onBlur={composeEventHandlers(onBlur, () => ctx.onOpenChange(false))}
      />
    );
  },
);
ComboboxInput.displayName = 'Combobox.Input';

/* -------------------------------------------------------------------------------------------------
 * Portal
 * -----------------------------------------------------------------------------------------------*/

export interface ComboboxPortalProps {
  children?: React.ReactNode;
  /** 포털을 붙일 대상. 기본값은 document.body. */
  container?: Element | DocumentFragment | null;
  /** 닫혀 있어도 자식을 렌더한다. */
  forceMount?: boolean;
}

export function ComboboxPortal({ children, container, forceMount }: ComboboxPortalProps) {
  const ctx = useComboboxContext('Portal');
  if (!(ctx.open || forceMount)) return null;
  return <Portal container={container}>{children}</Portal>;
}
ComboboxPortal.displayName = 'Combobox.Portal';

/* -------------------------------------------------------------------------------------------------
 * Content
 * -----------------------------------------------------------------------------------------------*/

export type ComboboxPointerDownOutsideEvent = CustomEvent<{ originalEvent: PointerEvent }>;

export interface ComboboxContentProps extends React.ComponentPropsWithoutRef<'div'>, AsChildProps {
  /** 닫혀 있어도 렌더한다. */
  forceMount?: boolean;
  /** 입력창 기준 배치 방향. 공간이 부족하면 반대편으로 뒤집힌다. 기본값 bottom. */
  side?: Side;
  /** 배치 방향 축에 대한 정렬. 기본값 start. */
  align?: Align;
  /** 입력창과의 간격(px). 기본값 4. */
  sideOffset?: number;
  /** Esc 키를 눌렀을 때 호출. preventDefault()로 닫힘을 막을 수 있다. */
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  /** Content 바깥에서 포인터를 눌렀을 때 호출. preventDefault()로 닫힘을 막을 수 있다. */
  onPointerDownOutside?: (event: ComboboxPointerDownOutsideEvent) => void;
}

const POINTER_DOWN_OUTSIDE = 'logicui.combobox.pointerDownOutside';

export const ComboboxContent = React.forwardRef<HTMLDivElement, ComboboxContentProps>(({ forceMount, ...props }, forwardedRef) => {
  const ctx = useComboboxContext('Content');
  if (!(ctx.open || forceMount)) return null;
  return <ComboboxContentImpl {...props} ref={forwardedRef} />;
});
ComboboxContent.displayName = 'Combobox.Content';

const ComboboxContentImpl = React.forwardRef<HTMLDivElement, Omit<ComboboxContentProps, 'forceMount'>>(
  ({ asChild, side = 'bottom', align = 'start', sideOffset = 4, onEscapeKeyDown, onPointerDownOutside, onMouseDown, ...props }, forwardedRef) => {
    const ctx = useComboboxContext('Content');
    const { open, onOpenChange, inputRef, contentRef, setActive, openIntentRef } = ctx;
    const ref = useComposedRefs(forwardedRef, contentRef);
    const layerRef = React.useRef({});

    useFloatingPosition(inputRef, contentRef, { side, align, sideOffset });

    const callbacks = React.useRef({ onEscapeKeyDown, onPointerDownOutside, onOpenChange });
    callbacks.current = { onEscapeKeyDown, onPointerDownOutside, onOpenChange };

    // 키보드(↓/↑)로 열었다면 처음/마지막 옵션을 가리키고, 입력으로 열었다면 아무것도 가리키지 않는다.
    useIsomorphicLayoutEffect(() => {
      const content = contentRef.current;
      if (!open || !content) return;
      content.style.setProperty('--logicui-combobox-input-width', `${inputRef.current?.offsetWidth ?? 0}px`);
      const intent = openIntentRef.current;
      openIntentRef.current = undefined;
      if (intent) {
        const options = getOptions(content);
        setActive(toActive(intent === 'last' ? options[options.length - 1] : options[0]));
      }
    }, [open]);

    React.useEffect(() => {
      const content = contentRef.current;
      if (!open) return;
      if (!content) return;
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
        if (!target || content.contains(target) || inputRef.current?.contains(target) || !layerStack.isTop(layer)) return;
        const outsideEvent: ComboboxPointerDownOutsideEvent = new CustomEvent(POINTER_DOWN_OUTSIDE, { cancelable: true, detail: { originalEvent: event } });
        callbacks.current.onPointerDownOutside?.(outsideEvent);
        if (!outsideEvent.defaultPrevented) callbacks.current.onOpenChange(false);
      };
      doc.addEventListener('keydown', handleKeyDown);
      doc.addEventListener('pointerdown', handlePointerDown);
      return () => {
        doc.removeEventListener('keydown', handleKeyDown);
        doc.removeEventListener('pointerdown', handlePointerDown);
        layerStack.remove(layer);
        setActive(undefined);
      };
    }, [open, contentRef, inputRef, setActive]);

    // 가리키는 옵션이 보이도록 스크롤한다.
    React.useEffect(() => {
      if (!ctx.active) return;
      contentRef.current?.ownerDocument.getElementById(ctx.active.id)?.scrollIntoView?.({ block: 'nearest' });
    }, [ctx.active, contentRef]);

    const Comp = getComp('div', asChild);
    return (
      <Comp
        role="listbox"
        id={ctx.contentId}
        data-state={open ? 'open' : 'closed'}
        data-side={side}
        data-align={align}
        {...props}
        ref={ref}
        // 옵션을 눌러도 포커스가 입력창에서 떠나지 않게 한다(떠나면 blur로 닫힌다).
        onMouseDown={composeEventHandlers(onMouseDown, (event: React.MouseEvent) => event.preventDefault())}
      />
    );
  },
);
ComboboxContentImpl.displayName = 'Combobox.ContentImpl';

/* -------------------------------------------------------------------------------------------------
 * Item
 * -----------------------------------------------------------------------------------------------*/

export interface ComboboxItemProps extends Omit<React.ComponentPropsWithoutRef<'div'>, 'onSelect'>, AsChildProps {
  /** 이 옵션이 나타내는 값. */
  value: string;
  /** 비활성화. 포커스 이동과 선택에서 제외된다. */
  disabled?: boolean;
  /** 선택했을 때 입력창에 채울 텍스트. 기본은 옵션의 텍스트다. */
  textValue?: string;
}

export const ComboboxItem = React.forwardRef<HTMLDivElement, ComboboxItemProps>(
  ({ asChild, value, disabled = false, textValue, onClick, onPointerMove, ...props }, forwardedRef) => {
    const ctx = useComboboxContext('Item');
    const id = React.useId();
    const itemRef = React.useRef<HTMLDivElement | null>(null);
    const ref = useComposedRefs(forwardedRef, itemRef);
    const selected = ctx.value === value;
    const highlighted = ctx.active?.id === id;
    const labelOf = (): string => textValue ?? itemRef.current?.textContent?.trim() ?? value;

    const Comp = getComp('div', asChild);
    return (
      <Comp
        role="option"
        id={id}
        aria-selected={selected}
        aria-disabled={disabled || undefined}
        data-value={value}
        data-text={textValue}
        data-state={selected ? 'checked' : 'unchecked'}
        data-highlighted={highlighted ? '' : undefined}
        data-disabled={disabled ? '' : undefined}
        {...props}
        ref={ref}
        onPointerMove={composeEventHandlers(onPointerMove, () => {
          if (!disabled && !highlighted) ctx.setActive({ value, id, label: labelOf() });
        })}
        onClick={composeEventHandlers(onClick, () => {
          if (!disabled) ctx.select(value, labelOf());
        })}
      />
    );
  },
);
ComboboxItem.displayName = 'Combobox.Item';

export {
  ComboboxRoot as Root,
  ComboboxInput as Input,
  ComboboxPortal as Portal,
  ComboboxContent as Content,
  ComboboxItem as Item,
};
