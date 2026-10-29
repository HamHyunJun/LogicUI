import * as React from 'react';
import { createPortal } from 'react-dom';
import { composeEventHandlers } from '../shared/compose-event-handlers';
import { focus } from '../shared/dom';
import { getComp, type AsChildProps } from '../shared/primitive';
import { useControllableState } from '../shared/use-controllable-state';

/*
 * 토스트: 잠깐 떴다 사라지는 알림. APG 패턴이 없어 WAI-ARIA live region(role="status" / "alert")을 따른다.
 *  - Viewport는 미리 존재하는 region이라 나중에 들어오는 Toast가 보조기기에 읽힌다.
 *  - 자동으로 닫히는 알림은 키보드 사용자가 놓치기 쉬우므로 F8로 Viewport에 포커스할 수 있다.
 *  - 포인터를 올리거나 포커스가 안에 있는 동안은 자동 닫힘 타이머를 멈추고, 남은 시간부터 이어서 센다.
 */

const DEFAULT_DURATION = 5000;

/* -------------------------------------------------------------------------------------------------
 * Provider
 * -----------------------------------------------------------------------------------------------*/

interface ToastProviderContextValue {
  duration: number;
  viewport: HTMLElement | null;
  setViewport: (el: HTMLElement | null) => void;
}

const ToastProviderContext = React.createContext<ToastProviderContextValue | null>(null);

function useToastProviderContext(part: string): ToastProviderContextValue {
  const context = React.useContext(ToastProviderContext);
  if (!context) {
    throw new Error(`<Toast.${part}>은(는) <Toast.Provider> 안에서만 사용할 수 있습니다.`);
  }
  return context;
}

export interface ToastProviderProps {
  children?: React.ReactNode;
  /** 토스트가 자동으로 닫히기까지의 시간(ms). Infinity면 자동으로 닫히지 않는다. 기본값 5000. */
  duration?: number;
}

export function ToastProvider({ children, duration = DEFAULT_DURATION }: ToastProviderProps) {
  const [viewport, setViewport] = React.useState<HTMLElement | null>(null);
  const context = React.useMemo<ToastProviderContextValue>(() => ({ duration, viewport, setViewport }), [duration, viewport]);
  return <ToastProviderContext.Provider value={context}>{children}</ToastProviderContext.Provider>;
}
ToastProvider.displayName = 'Toast.Provider';

/* -------------------------------------------------------------------------------------------------
 * Viewport
 * -----------------------------------------------------------------------------------------------*/

export interface ToastViewportProps extends React.ComponentPropsWithoutRef<'div'>, AsChildProps {
  /** 이 키를 누르면 Viewport로 포커스를 옮긴다. 기본값 F8. */
  hotkey?: string;
}

/** Toast가 쌓이는 region. 화면 어디에 둘지는 스타일로 정한다. */
export const ToastViewport = React.forwardRef<HTMLDivElement, ToastViewportProps>(
  ({ asChild, hotkey = 'F8', ...props }, forwardedRef) => {
    const { setViewport } = useToastProviderContext('Viewport');
    const elRef = React.useRef<HTMLDivElement | null>(null);

    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        elRef.current = node;
        setViewport(node);
        if (typeof forwardedRef === 'function') forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef, setViewport],
    );

    React.useEffect(() => {
      const doc = elRef.current?.ownerDocument;
      if (!doc) return;
      const handleKeyDown = (event: KeyboardEvent): void => {
        if (event.key === hotkey) focus(elRef.current);
      };
      doc.addEventListener('keydown', handleKeyDown);
      return () => doc.removeEventListener('keydown', handleKeyDown);
    }, [hotkey]);

    const Comp = getComp('div', asChild);
    return <Comp role="region" aria-label={`알림 (${hotkey})`} tabIndex={-1} {...props} ref={setRefs} />;
  },
);
ToastViewport.displayName = 'Toast.Viewport';

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/

interface ToastRootContextValue {
  close: () => void;
}

const ToastRootContext = React.createContext<ToastRootContextValue | null>(null);

function useToastRootContext(part: string): ToastRootContextValue {
  const context = React.useContext(ToastRootContext);
  if (!context) {
    throw new Error(`<Toast.${part}>은(는) <Toast.Root> 안에서만 사용할 수 있습니다.`);
  }
  return context;
}

export interface ToastRootProps extends Omit<React.ComponentPropsWithoutRef<'div'>, 'children'>, AsChildProps {
  children?: React.ReactNode;
  /** 제어 모드의 열림 상태. */
  open?: boolean;
  /** 비제어 모드의 초기 열림 상태. 기본값 true. */
  defaultOpen?: boolean;
  /** 열림 상태가 바뀌어야 할 때(자동 닫힘, Esc, 닫기·액션 버튼) 호출된다. */
  onOpenChange?: (open: boolean) => void;
  /** 이 토스트만의 자동 닫힘 시간(ms). 지정하지 않으면 Provider 값을 쓴다. */
  duration?: number;
  /**
   * background(기본값)는 role="status"로 하던 일을 방해하지 않고 읽어 주고, foreground는 role="alert"로 즉시 읽는다.
   * 사용자의 행동에 대한 결과가 아닌 중요한 오류에만 foreground를 쓴다.
   */
  type?: 'foreground' | 'background';
  /** 닫혀 있어도 렌더한다(퇴장 애니메이션을 직접 제어할 때 사용). */
  forceMount?: boolean;
}

export const ToastRoot = React.forwardRef<HTMLDivElement, ToastRootProps>(
  (
    {
      asChild,
      open: openProp,
      defaultOpen = true,
      onOpenChange,
      duration: durationProp,
      type = 'background',
      forceMount,
      onPointerEnter,
      onPointerLeave,
      onFocus,
      onBlur,
      onKeyDown,
      ...props
    },
    forwardedRef,
  ) => {
    const provider = useToastProviderContext('Root');
    const [open, setOpen] = useControllableState({ prop: openProp, defaultProp: defaultOpen, onChange: onOpenChange });
    const duration = durationProp ?? provider.duration;
    const closeRef = React.useRef(() => setOpen(false));
    closeRef.current = () => setOpen(false);

    // 자동 닫힘 타이머: 호버·포커스 중에는 멈추고 남은 시간부터 이어서 센다.
    const timer = React.useRef({ id: 0, remaining: duration, startedAt: 0, hovered: false, focused: false });
    const stop = React.useCallback(() => {
      const t = timer.current;
      if (t.id) {
        window.clearTimeout(t.id);
        t.id = 0;
        t.remaining -= Date.now() - t.startedAt;
      }
    }, []);
    const sync = React.useCallback(() => {
      const t = timer.current;
      if (t.hovered || t.focused) {
        stop();
      } else if (!t.id && Number.isFinite(t.remaining)) {
        t.startedAt = Date.now();
        t.id = window.setTimeout(() => closeRef.current(), Math.max(0, t.remaining));
      }
    }, [stop]);

    React.useEffect(() => {
      if (!open) return;
      const t = timer.current;
      t.remaining = duration;
      t.hovered = false;
      t.focused = false;
      sync();
      return () => {
        window.clearTimeout(t.id);
        t.id = 0;
      };
    }, [open, duration, sync]);

    const context = React.useMemo<ToastRootContextValue>(() => ({ close: () => closeRef.current() }), []);

    if (!(open || forceMount) || !provider.viewport) return null;
    const Comp = getComp('div', asChild);
    return createPortal(
      <ToastRootContext.Provider value={context}>
        <Comp
          role={type === 'foreground' ? 'alert' : 'status'}
          aria-live={type === 'foreground' ? 'assertive' : 'polite'}
          aria-atomic="true"
          tabIndex={0}
          data-state={open ? 'open' : 'closed'}
          data-type={type}
          {...props}
          ref={forwardedRef}
          onPointerEnter={composeEventHandlers(onPointerEnter, () => {
            timer.current.hovered = true;
            sync();
          })}
          onPointerLeave={composeEventHandlers(onPointerLeave, () => {
            timer.current.hovered = false;
            sync();
          })}
          onFocus={composeEventHandlers(onFocus, () => {
            timer.current.focused = true;
            sync();
          })}
          onBlur={composeEventHandlers(onBlur, (event: React.FocusEvent<HTMLDivElement>) => {
            // 토스트 안의 다른 요소로 옮겨 가는 경우는 포커스가 남아 있는 것이다.
            if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
            timer.current.focused = false;
            sync();
          })}
          onKeyDown={composeEventHandlers(onKeyDown, (event: React.KeyboardEvent) => {
            if (event.key === 'Escape') {
              event.stopPropagation();
              closeRef.current();
            }
          })}
        />
      </ToastRootContext.Provider>,
      provider.viewport,
    );
  },
);
ToastRoot.displayName = 'Toast.Root';

/* -------------------------------------------------------------------------------------------------
 * Title / Description
 * -----------------------------------------------------------------------------------------------*/

export type ToastTitleProps = React.ComponentPropsWithoutRef<'div'> & AsChildProps;

export const ToastTitle = React.forwardRef<HTMLDivElement, ToastTitleProps>(({ asChild, ...props }, forwardedRef) => {
  useToastRootContext('Title');
  const Comp = getComp('div', asChild);
  return <Comp {...props} ref={forwardedRef} />;
});
ToastTitle.displayName = 'Toast.Title';

export type ToastDescriptionProps = React.ComponentPropsWithoutRef<'div'> & AsChildProps;

export const ToastDescription = React.forwardRef<HTMLDivElement, ToastDescriptionProps>(({ asChild, ...props }, forwardedRef) => {
  useToastRootContext('Description');
  const Comp = getComp('div', asChild);
  return <Comp {...props} ref={forwardedRef} />;
});
ToastDescription.displayName = 'Toast.Description';

/* -------------------------------------------------------------------------------------------------
 * Action / Close
 * -----------------------------------------------------------------------------------------------*/

export type ToastActionProps = React.ComponentPropsWithoutRef<'button'> & AsChildProps;

/** 토스트에서 바로 할 수 있는 동작(예: 실행 취소). 누르면 onClick을 호출하고 토스트를 닫는다. */
export const ToastAction = React.forwardRef<HTMLButtonElement, ToastActionProps>(({ asChild, onClick, ...props }, forwardedRef) => {
  const root = useToastRootContext('Action');
  const Comp = getComp('button', asChild);
  return <Comp type={asChild ? undefined : 'button'} {...props} ref={forwardedRef} onClick={composeEventHandlers(onClick, root.close)} />;
});
ToastAction.displayName = 'Toast.Action';

export type ToastCloseProps = React.ComponentPropsWithoutRef<'button'> & AsChildProps;

/** 토스트를 닫는 버튼. 아이콘만 있다면 aria-label을 붙인다. */
export const ToastClose = React.forwardRef<HTMLButtonElement, ToastCloseProps>(({ asChild, onClick, ...props }, forwardedRef) => {
  const root = useToastRootContext('Close');
  const Comp = getComp('button', asChild);
  return <Comp type={asChild ? undefined : 'button'} {...props} ref={forwardedRef} onClick={composeEventHandlers(onClick, root.close)} />;
});
ToastClose.displayName = 'Toast.Close';

export {
  ToastProvider as Provider,
  ToastViewport as Viewport,
  ToastRoot as Root,
  ToastTitle as Title,
  ToastDescription as Description,
  ToastAction as Action,
  ToastClose as Close,
};
