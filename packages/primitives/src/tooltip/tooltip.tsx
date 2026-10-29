import * as React from 'react';
import { composeEventHandlers } from '../shared/compose-event-handlers';
import { useComposedRefs } from '../shared/compose-refs';
import { Portal } from '../shared/portal';
import type { Align, Side } from '../shared/position';
import { getComp, type AsChildProps } from '../shared/primitive';
import { useControllableState } from '../shared/use-controllable-state';
import { useFloatingPosition } from '../shared/use-floating-position';

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/

interface TooltipContextValue {
  open: boolean;
  contentId: string;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  /** 호버: delayDuration 뒤에 연다. */
  show: () => void;
  /** 포커스: 지연 없이 연다. */
  showNow: () => void;
  /** 즉시 닫는다. */
  hide: () => void;
  /** closeDelay 뒤에 닫는다. 그 사이 Content에 들어가면 취소된다 (WCAG 1.4.13 hoverable). */
  hideSoon: () => void;
  /** 예약된 열기/닫기를 취소한다. */
  cancel: () => void;
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null);

function useTooltipContext(part: string): TooltipContextValue {
  const context = React.useContext(TooltipContext);
  if (!context) {
    throw new Error(`<Tooltip.${part}>은(는) <Tooltip.Root> 안에서만 사용할 수 있습니다.`);
  }
  return context;
}

const getState = (open: boolean) => (open ? 'open' : 'closed');

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/

export interface TooltipRootProps {
  children?: React.ReactNode;
  /** 제어 모드의 열림 상태. */
  open?: boolean;
  /** 비제어 모드의 초기 열림 상태. */
  defaultOpen?: boolean;
  /** 열림 상태가 바뀌어야 할 때 호출된다. */
  onOpenChange?: (open: boolean) => void;
  /** 포인터를 올린 뒤 열리기까지의 지연(ms). 기본값 700. 포커스로 열 때는 적용되지 않는다. */
  delayDuration?: number;
  /** 포인터가 트리거를 벗어난 뒤 닫히기까지의 유예(ms). 기본값 100. 이 사이 Content로 옮겨가면 유지된다. */
  closeDelay?: number;
}

export function TooltipRoot({
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  delayDuration = 700,
  closeDelay = 100,
}: TooltipRootProps) {
  const [open, setOpen] = useControllableState({ prop: openProp, defaultProp: defaultOpen, onChange: onOpenChange });
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const contentId = `${React.useId()}-content`;
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const cancel = React.useCallback((): void => {
    if (timer.current !== undefined) clearTimeout(timer.current);
    timer.current = undefined;
  }, []);

  const schedule = React.useCallback(
    (next: boolean, delay: number): void => {
      cancel();
      if (delay <= 0) {
        setOpen(next);
        return;
      }
      timer.current = setTimeout(() => {
        timer.current = undefined;
        setOpen(next);
      }, delay);
    },
    [cancel, setOpen],
  );

  // 언마운트 후 예약된 상태 변경이 실행되지 않도록 정리한다.
  React.useEffect(() => cancel, [cancel]);

  const value = React.useMemo<TooltipContextValue>(
    () => ({
      open,
      contentId,
      triggerRef,
      show: () => schedule(true, delayDuration),
      showNow: () => schedule(true, 0),
      hide: () => schedule(false, 0),
      hideSoon: () => schedule(false, closeDelay),
      cancel,
    }),
    [open, contentId, schedule, delayDuration, closeDelay, cancel],
  );
  return <TooltipContext.Provider value={value}>{children}</TooltipContext.Provider>;
}
TooltipRoot.displayName = 'Tooltip.Root';

/* -------------------------------------------------------------------------------------------------
 * Trigger
 * -----------------------------------------------------------------------------------------------*/

export type TooltipTriggerProps = React.ComponentPropsWithoutRef<'button'> & AsChildProps;

export const TooltipTrigger = React.forwardRef<HTMLButtonElement, TooltipTriggerProps>(
  ({ asChild, onPointerEnter, onPointerLeave, onPointerDown, onFocus, onBlur, ...props }, forwardedRef) => {
    const context = useTooltipContext('Trigger');
    const ref = useComposedRefs(forwardedRef, context.triggerRef);
    // 클릭으로 생긴 포커스가 방금 닫은 툴팁을 다시 열지 않도록 포인터 누름 상태를 기억한다.
    const isPointerDown = React.useRef(false);
    const Comp = getComp('button', asChild);

    return (
      <Comp
        type={asChild ? undefined : 'button'}
        aria-describedby={context.open ? context.contentId : undefined}
        data-state={getState(context.open)}
        {...props}
        ref={ref}
        onPointerEnter={composeEventHandlers(onPointerEnter, (event: React.PointerEvent<HTMLButtonElement>) => {
          // 터치는 호버가 없다.
          if (event.pointerType !== 'touch') context.show();
        })}
        onPointerLeave={composeEventHandlers(onPointerLeave, context.hideSoon)}
        onPointerDown={composeEventHandlers(onPointerDown, (event: React.PointerEvent<HTMLButtonElement>) => {
          isPointerDown.current = true;
          event.currentTarget.ownerDocument.addEventListener(
            'pointerup',
            () => {
              isPointerDown.current = false;
            },
            { once: true },
          );
          context.hide();
        })}
        onFocus={composeEventHandlers(onFocus, () => {
          if (!isPointerDown.current) context.showNow();
        })}
        onBlur={composeEventHandlers(onBlur, context.hide)}
      />
    );
  },
);
TooltipTrigger.displayName = 'Tooltip.Trigger';

/* -------------------------------------------------------------------------------------------------
 * Portal
 * -----------------------------------------------------------------------------------------------*/

export interface TooltipPortalProps {
  children?: React.ReactNode;
  /** 포털을 붙일 대상. 기본값은 document.body. */
  container?: Element | DocumentFragment | null;
  /** 닫혀 있어도 자식을 렌더한다. */
  forceMount?: boolean;
}

export function TooltipPortal({ children, container, forceMount }: TooltipPortalProps) {
  const context = useTooltipContext('Portal');
  if (!(context.open || forceMount)) return null;
  return <Portal container={container}>{children}</Portal>;
}
TooltipPortal.displayName = 'Tooltip.Portal';

/* -------------------------------------------------------------------------------------------------
 * Content
 * -----------------------------------------------------------------------------------------------*/

export interface TooltipContentProps extends React.ComponentPropsWithoutRef<'div'>, AsChildProps {
  /** 닫혀 있어도 렌더한다. */
  forceMount?: boolean;
  /** 트리거 기준 배치 방향. 공간이 부족하면 반대편으로 뒤집힌다. 기본값 top. */
  side?: Side;
  /** 배치 방향 축에 대한 정렬. 기본값 center. */
  align?: Align;
  /** 트리거와의 간격(px). 기본값 4. */
  sideOffset?: number;
  /** Esc 키를 눌렀을 때 호출. preventDefault()로 닫힘을 막을 수 있다. */
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
}

export const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ forceMount, ...props }, forwardedRef) => {
    const context = useTooltipContext('Content');
    if (!(context.open || forceMount)) return null;
    return <TooltipContentImpl {...props} ref={forwardedRef} />;
  },
);
TooltipContent.displayName = 'Tooltip.Content';

type TooltipContentImplProps = Omit<TooltipContentProps, 'forceMount'>;

const TooltipContentImpl = React.forwardRef<HTMLDivElement, TooltipContentImplProps>(
  (
    { asChild, side = 'top', align = 'center', sideOffset = 4, onEscapeKeyDown, onPointerEnter, onPointerLeave, ...props },
    forwardedRef,
  ) => {
    const context = useTooltipContext('Content');
    const contentRef = React.useRef<HTMLDivElement | null>(null);
    const ref = useComposedRefs(forwardedRef, contentRef);

    useFloatingPosition(context.triggerRef, contentRef, { side, align, sideOffset });

    const callbacks = React.useRef({ onEscapeKeyDown, hide: context.hide });
    callbacks.current = { onEscapeKeyDown, hide: context.hide };

    // Esc로 닫는다 (WCAG 1.4.13 dismissible). 포커스가 어디에 있든 동작해야 한다.
    React.useEffect(() => {
      const doc = contentRef.current?.ownerDocument;
      if (!doc) return;
      const handleKeyDown = (event: KeyboardEvent): void => {
        if (event.key !== 'Escape') return;
        callbacks.current.onEscapeKeyDown?.(event);
        if (!event.defaultPrevented) callbacks.current.hide();
      };
      doc.addEventListener('keydown', handleKeyDown);
      return () => doc.removeEventListener('keydown', handleKeyDown);
    }, []);

    const Comp = getComp('div', asChild);
    return (
      <Comp
        role="tooltip"
        id={context.contentId}
        data-state={getState(context.open)}
        data-side={side}
        data-align={align}
        {...props}
        ref={ref}
        onPointerEnter={composeEventHandlers(onPointerEnter, context.cancel)}
        onPointerLeave={composeEventHandlers(onPointerLeave, context.hideSoon)}
      />
    );
  },
);
TooltipContentImpl.displayName = 'Tooltip.ContentImpl';

/* -------------------------------------------------------------------------------------------------
 * 합성 컴포넌트용 짧은 이름
 * -----------------------------------------------------------------------------------------------*/

export { TooltipRoot as Root, TooltipTrigger as Trigger, TooltipPortal as Portal, TooltipContent as Content };
