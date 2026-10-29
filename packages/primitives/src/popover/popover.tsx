import * as React from 'react';
import { composeEventHandlers } from '../shared/compose-event-handlers';
import { useComposedRefs } from '../shared/compose-refs';
import { focus, getTabbableElements } from '../shared/dom';
import { layerStack } from '../shared/layer-stack';
import { Portal } from '../shared/portal';
import type { Align, Side } from '../shared/position';
import { getComp, type AsChildProps } from '../shared/primitive';
import { useControllableState } from '../shared/use-controllable-state';
import { useFloatingPosition } from '../shared/use-floating-position';

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/

interface PopoverContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenToggle: () => void;
  contentId: string;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null);

function usePopoverContext(part: string): PopoverContextValue {
  const context = React.useContext(PopoverContext);
  if (!context) {
    throw new Error(`<Popover.${part}>은(는) <Popover.Root> 안에서만 사용할 수 있습니다.`);
  }
  return context;
}

const getState = (open: boolean) => (open ? 'open' : 'closed');

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/

export interface PopoverRootProps {
  children?: React.ReactNode;
  /** 제어 모드의 열림 상태. */
  open?: boolean;
  /** 비제어 모드의 초기 열림 상태. */
  defaultOpen?: boolean;
  /** 열림 상태가 바뀌어야 할 때 호출된다. */
  onOpenChange?: (open: boolean) => void;
}

export function PopoverRoot({ children, open: openProp, defaultOpen = false, onOpenChange }: PopoverRootProps) {
  const [open, setOpen] = useControllableState({ prop: openProp, defaultProp: defaultOpen, onChange: onOpenChange });
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const contentId = `${React.useId()}-content`;

  const value = React.useMemo<PopoverContextValue>(
    () => ({ open, onOpenChange: setOpen, onOpenToggle: () => setOpen(!open), contentId, triggerRef }),
    [open, setOpen, contentId],
  );
  return <PopoverContext.Provider value={value}>{children}</PopoverContext.Provider>;
}
PopoverRoot.displayName = 'Popover.Root';

/* -------------------------------------------------------------------------------------------------
 * Trigger
 * -----------------------------------------------------------------------------------------------*/

export type PopoverTriggerProps = React.ComponentPropsWithoutRef<'button'> & AsChildProps;

export const PopoverTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  ({ asChild, onClick, ...props }, forwardedRef) => {
    const context = usePopoverContext('Trigger');
    const ref = useComposedRefs(forwardedRef, context.triggerRef);
    const Comp = getComp('button', asChild);
    return (
      <Comp
        type={asChild ? undefined : 'button'}
        aria-haspopup="dialog"
        aria-expanded={context.open}
        aria-controls={context.open ? context.contentId : undefined}
        data-state={getState(context.open)}
        {...props}
        ref={ref}
        onClick={composeEventHandlers(onClick, context.onOpenToggle)}
      />
    );
  },
);
PopoverTrigger.displayName = 'Popover.Trigger';

/* -------------------------------------------------------------------------------------------------
 * Portal
 * -----------------------------------------------------------------------------------------------*/

export interface PopoverPortalProps {
  children?: React.ReactNode;
  /** 포털을 붙일 대상. 기본값은 document.body. */
  container?: Element | DocumentFragment | null;
  /** 닫혀 있어도 자식을 렌더한다. */
  forceMount?: boolean;
}

export function PopoverPortal({ children, container, forceMount }: PopoverPortalProps) {
  const context = usePopoverContext('Portal');
  if (!(context.open || forceMount)) return null;
  return <Portal container={container}>{children}</Portal>;
}
PopoverPortal.displayName = 'Popover.Portal';

/* -------------------------------------------------------------------------------------------------
 * Content
 * -----------------------------------------------------------------------------------------------*/

export type PopoverPointerDownOutsideEvent = CustomEvent<{ originalEvent: PointerEvent }>;
export type PopoverFocusOutsideEvent = CustomEvent<{ originalEvent: FocusEvent }>;

export interface PopoverContentProps extends React.ComponentPropsWithoutRef<'div'>, AsChildProps {
  /** 닫혀 있어도 렌더한다. */
  forceMount?: boolean;
  /** 트리거 기준 배치 방향. 공간이 부족하면 반대편으로 뒤집힌다. 기본값 bottom. */
  side?: Side;
  /** 배치 방향 축에 대한 정렬. 기본값 center. */
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
  onPointerDownOutside?: (event: PopoverPointerDownOutsideEvent) => void;
  /** 포커스가 Content 바깥으로 이동했을 때 호출. preventDefault()로 닫힘을 막을 수 있다. */
  onFocusOutside?: (event: PopoverFocusOutsideEvent) => void;
}

const OPEN_AUTO_FOCUS = 'logicui.popover.openAutoFocus';
const CLOSE_AUTO_FOCUS = 'logicui.popover.closeAutoFocus';
const POINTER_DOWN_OUTSIDE = 'logicui.popover.pointerDownOutside';
const FOCUS_OUTSIDE = 'logicui.popover.focusOutside';

export const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ forceMount, ...props }, forwardedRef) => {
    const context = usePopoverContext('Content');
    if (!(context.open || forceMount)) return null;
    return <PopoverContentImpl {...props} ref={forwardedRef} />;
  },
);
PopoverContent.displayName = 'Popover.Content';

type PopoverContentImplProps = Omit<PopoverContentProps, 'forceMount'>;

const PopoverContentImpl = React.forwardRef<HTMLDivElement, PopoverContentImplProps>(
  (
    {
      asChild,
      side = 'bottom',
      align = 'center',
      sideOffset = 4,
      onOpenAutoFocus,
      onCloseAutoFocus,
      onEscapeKeyDown,
      onPointerDownOutside,
      onFocusOutside,
      ...props
    },
    forwardedRef,
  ) => {
    const context = usePopoverContext('Content');
    const { open, onOpenChange, triggerRef } = context;
    const contentRef = React.useRef<HTMLDivElement | null>(null);
    const ref = useComposedRefs(forwardedRef, contentRef);
    const layerRef = React.useRef({});

    useFloatingPosition(triggerRef, contentRef, { side, align, sideOffset });

    // 콜백은 ref로 최신값만 유지해 이펙트가 재실행되지 않도록 한다.
    const callbacks = React.useRef({
      onOpenAutoFocus,
      onCloseAutoFocus,
      onEscapeKeyDown,
      onPointerDownOutside,
      onFocusOutside,
      onOpenChange,
    });
    callbacks.current = { onOpenAutoFocus, onCloseAutoFocus, onEscapeKeyDown, onPointerDownOutside, onFocusOutside, onOpenChange };

    React.useEffect(() => {
      const content = contentRef.current;
      if (!content || !open) return;
      const doc = content.ownerDocument;
      const layer = layerRef.current;
      layerStack.push(layer);

      const openEvent = new Event(OPEN_AUTO_FOCUS, { cancelable: true });
      callbacks.current.onOpenAutoFocus?.(openEvent);
      if (!openEvent.defaultPrevented && !content.contains(doc.activeElement)) {
        focus(getTabbableElements(content)[0] ?? content);
      }

      const handleKeyDown = (event: KeyboardEvent): void => {
        if (event.key !== 'Escape' || !layerStack.isTop(layer)) return;
        callbacks.current.onEscapeKeyDown?.(event);
        if (!event.defaultPrevented) callbacks.current.onOpenChange(false);
      };

      // 바깥 포인터 닫힘을 소비자가 막았다면, 그 클릭이 만드는 포커스 이동으로도 닫지 않는다.
      let ignoreFocusOutside = false;

      const handlePointerDown = (event: PointerEvent): void => {
        const target = event.target as Node | null;
        if (!target || content.contains(target) || !layerStack.isTop(layer)) return;
        // 트리거 클릭은 토글이 담당한다.
        if (triggerRef.current?.contains(target)) return;
        const outsideEvent: PopoverPointerDownOutsideEvent = new CustomEvent(POINTER_DOWN_OUTSIDE, {
          cancelable: true,
          detail: { originalEvent: event },
        });
        callbacks.current.onPointerDownOutside?.(outsideEvent);
        if (!outsideEvent.defaultPrevented) {
          callbacks.current.onOpenChange(false);
        } else {
          ignoreFocusOutside = true;
          setTimeout(() => {
            ignoreFocusOutside = false;
          }, 0);
        }
      };

      const handleFocusIn = (event: FocusEvent): void => {
        const target = event.target as Node | null;
        if (ignoreFocusOutside || !target || content.contains(target) || triggerRef.current?.contains(target) || !layerStack.isTop(layer)) return;
        const outsideEvent: PopoverFocusOutsideEvent = new CustomEvent(FOCUS_OUTSIDE, {
          cancelable: true,
          detail: { originalEvent: event },
        });
        callbacks.current.onFocusOutside?.(outsideEvent);
        if (!outsideEvent.defaultPrevented) callbacks.current.onOpenChange(false);
      };

      doc.addEventListener('keydown', handleKeyDown);
      doc.addEventListener('pointerdown', handlePointerDown);
      doc.addEventListener('focusin', handleFocusIn);

      return () => {
        doc.removeEventListener('keydown', handleKeyDown);
        doc.removeEventListener('pointerdown', handlePointerDown);
        doc.removeEventListener('focusin', handleFocusIn);
        layerStack.remove(layer);

        const closeEvent = new Event(CLOSE_AUTO_FOCUS, { cancelable: true });
        callbacks.current.onCloseAutoFocus?.(closeEvent);
        if (closeEvent.defaultPrevented) return;
        // 포커스가 팝오버 안에 있었거나 갈 곳을 잃은 경우에만 트리거로 돌려준다.
        // 바깥 클릭·Tab으로 다른 요소가 포커스를 받았다면 빼앗지 않는다.
        const active = doc.activeElement;
        if (!active || active === doc.body || content.contains(active)) focus(triggerRef.current);
      };
    }, [open, triggerRef]);

    const Comp = getComp('div', asChild);
    return (
      <Comp
        role="dialog"
        id={context.contentId}
        tabIndex={-1}
        data-state={getState(open)}
        data-side={side}
        data-align={align}
        {...props}
        ref={ref}
      />
    );
  },
);
PopoverContentImpl.displayName = 'Popover.ContentImpl';

/* -------------------------------------------------------------------------------------------------
 * Close
 * -----------------------------------------------------------------------------------------------*/

export type PopoverCloseProps = React.ComponentPropsWithoutRef<'button'> & AsChildProps;

export const PopoverClose = React.forwardRef<HTMLButtonElement, PopoverCloseProps>(
  ({ asChild, onClick, ...props }, forwardedRef) => {
    const context = usePopoverContext('Close');
    const Comp = getComp('button', asChild);
    return (
      <Comp
        type={asChild ? undefined : 'button'}
        {...props}
        ref={forwardedRef}
        onClick={composeEventHandlers(onClick, () => context.onOpenChange(false))}
      />
    );
  },
);
PopoverClose.displayName = 'Popover.Close';

/* -------------------------------------------------------------------------------------------------
 * 합성 컴포넌트용 짧은 이름
 * -----------------------------------------------------------------------------------------------*/

export {
  PopoverRoot as Root,
  PopoverTrigger as Trigger,
  PopoverPortal as Portal,
  PopoverContent as Content,
  PopoverClose as Close,
};
