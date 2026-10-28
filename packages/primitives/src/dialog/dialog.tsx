import * as React from 'react';
import { createPortal } from 'react-dom';
import { composeEventHandlers } from '../shared/compose-event-handlers';
import { useComposedRefs } from '../shared/compose-refs';
import { focus, getTabbableElements } from '../shared/dom';
import { hideOthers } from '../shared/hide-others';
import { layerStack } from '../shared/layer-stack';
import { getComp, type AsChildProps } from '../shared/primitive';
import { lockScroll } from '../shared/scroll-lock';
import { useControllableState } from '../shared/use-controllable-state';
import { useIsomorphicLayoutEffect } from '../shared/use-isomorphic-layout-effect';

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenToggle: () => void;
  modal: boolean;
  contentId: string;
  titleId: string;
  descriptionId: string;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  overlayRef: React.RefObject<HTMLDivElement | null>;
  hasTitle: boolean;
  setHasTitle: (value: boolean) => void;
  hasDescription: boolean;
  setHasDescription: (value: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialogContext(part: string): DialogContextValue {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error(`<Dialog.${part}>은(는) <Dialog.Root> 안에서만 사용할 수 있습니다.`);
  }
  return context;
}

const getState = (open: boolean) => (open ? 'open' : 'closed');

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/

export interface DialogRootProps {
  children?: React.ReactNode;
  /** 제어 모드의 열림 상태. */
  open?: boolean;
  /** 비제어 모드의 초기 열림 상태. */
  defaultOpen?: boolean;
  /** 열림 상태가 바뀌어야 할 때 호출된다. */
  onOpenChange?: (open: boolean) => void;
  /**
   * true(기본값)면 모달로 동작한다: 포커스 트랩, 바깥 요소 inert 처리, body 스크롤 잠금, aria-modal.
   * false면 바깥과 상호작용 가능한 비모달 다이얼로그가 된다.
   */
  modal?: boolean;
}

export function DialogRoot({ children, open: openProp, defaultOpen = false, onOpenChange, modal = true }: DialogRootProps) {
  const [open, setOpen] = useControllableState({ prop: openProp, defaultProp: defaultOpen, onChange: onOpenChange });
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const overlayRef = React.useRef<HTMLDivElement | null>(null);
  const [hasTitle, setHasTitle] = React.useState(false);
  const [hasDescription, setHasDescription] = React.useState(false);
  const baseId = React.useId();

  const value = React.useMemo<DialogContextValue>(
    () => ({
      open,
      onOpenChange: setOpen,
      onOpenToggle: () => setOpen(!open),
      modal,
      contentId: `${baseId}-content`,
      titleId: `${baseId}-title`,
      descriptionId: `${baseId}-description`,
      triggerRef,
      overlayRef,
      hasTitle,
      setHasTitle,
      hasDescription,
      setHasDescription,
    }),
    [open, setOpen, modal, baseId, hasTitle, hasDescription],
  );

  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>;
}
DialogRoot.displayName = 'Dialog.Root';

/* -------------------------------------------------------------------------------------------------
 * Trigger
 * -----------------------------------------------------------------------------------------------*/

export type DialogTriggerProps = React.ComponentPropsWithoutRef<'button'> & AsChildProps;

export const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ asChild, onClick, ...props }, forwardedRef) => {
    const context = useDialogContext('Trigger');
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
DialogTrigger.displayName = 'Dialog.Trigger';

/* -------------------------------------------------------------------------------------------------
 * Portal
 * -----------------------------------------------------------------------------------------------*/

export interface DialogPortalProps {
  children?: React.ReactNode;
  /** 포털을 붙일 대상. 기본값은 document.body. */
  container?: Element | DocumentFragment | null;
  /** 닫혀 있어도 자식을 렌더한다 (퇴장 애니메이션을 직접 제어할 때 사용). */
  forceMount?: boolean;
}

export function DialogPortal({ children, container, forceMount }: DialogPortalProps) {
  const context = useDialogContext('Portal');
  // SSR에서는 document가 없으므로 클라이언트 마운트 이후에만 포털을 만든다.
  const [mounted, setMounted] = React.useState(false);
  useIsomorphicLayoutEffect(() => setMounted(true), []);

  if (!mounted || !(context.open || forceMount)) return null;
  return createPortal(children, container ?? document.body);
}
DialogPortal.displayName = 'Dialog.Portal';

/* -------------------------------------------------------------------------------------------------
 * Overlay
 * -----------------------------------------------------------------------------------------------*/

export type DialogOverlayProps = React.ComponentPropsWithoutRef<'div'> &
  AsChildProps & {
    /** 닫혀 있어도 렌더한다. */
    forceMount?: boolean;
  };

export const DialogOverlay = React.forwardRef<HTMLDivElement, DialogOverlayProps>(
  ({ asChild, forceMount, ...props }, forwardedRef) => {
    const context = useDialogContext('Overlay');
    const ref = useComposedRefs(forwardedRef, context.overlayRef);
    // 오버레이는 모달에서만 의미가 있다.
    if (!context.modal || !(context.open || forceMount)) return null;
    const Comp = getComp('div', asChild);
    return <Comp data-state={getState(context.open)} {...props} ref={ref} />;
  },
);
DialogOverlay.displayName = 'Dialog.Overlay';

/* -------------------------------------------------------------------------------------------------
 * Content
 * -----------------------------------------------------------------------------------------------*/

export type PointerDownOutsideEvent = CustomEvent<{ originalEvent: PointerEvent }>;

export type DialogContentProps = React.ComponentPropsWithoutRef<'div'> &
  AsChildProps & {
    /** 닫혀 있어도 렌더한다. */
    forceMount?: boolean;
    /** 열릴 때 자동 포커스 직전에 호출. preventDefault()로 기본 포커스 이동을 막을 수 있다. */
    onOpenAutoFocus?: (event: Event) => void;
    /** 닫힐 때 트리거로 포커스를 되돌리기 직전에 호출. preventDefault()로 막을 수 있다. */
    onCloseAutoFocus?: (event: Event) => void;
    /** Esc 키를 눌렀을 때 호출. preventDefault()로 닫힘을 막을 수 있다. */
    onEscapeKeyDown?: (event: KeyboardEvent) => void;
    /** Content 바깥에서 포인터를 눌렀을 때 호출. preventDefault()로 닫힘을 막을 수 있다. */
    onPointerDownOutside?: (event: PointerDownOutsideEvent) => void;
  };

const OPEN_AUTO_FOCUS = 'logicui.dialog.openAutoFocus';
const CLOSE_AUTO_FOCUS = 'logicui.dialog.closeAutoFocus';
const POINTER_DOWN_OUTSIDE = 'logicui.dialog.pointerDownOutside';

export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ forceMount, ...props }, forwardedRef) => {
    const context = useDialogContext('Content');
    if (!(context.open || forceMount)) return null;
    return <DialogContentImpl {...props} ref={forwardedRef} />;
  },
);
DialogContent.displayName = 'Dialog.Content';

type DialogContentImplProps = Omit<DialogContentProps, 'forceMount'>;

const DialogContentImpl = React.forwardRef<HTMLDivElement, DialogContentImplProps>(
  (
    { asChild, onOpenAutoFocus, onCloseAutoFocus, onEscapeKeyDown, onPointerDownOutside, onKeyDown, ...props },
    forwardedRef,
  ) => {
    const context = useDialogContext('Content');
    const { modal, open, onOpenChange, triggerRef, overlayRef } = context;
    const contentRef = React.useRef<HTMLDivElement | null>(null);
    const ref = useComposedRefs(forwardedRef, contentRef);
    // 레이어 식별자. 중첩 다이얼로그 중 최상위인지 판별하는 데 쓴다.
    const layerRef = React.useRef({});

    // 콜백은 ref로 최신값만 유지해 이펙트가 재실행되지 않도록 한다.
    const callbacks = React.useRef({ onOpenAutoFocus, onCloseAutoFocus, onEscapeKeyDown, onPointerDownOutside, onOpenChange });
    callbacks.current = { onOpenAutoFocus, onCloseAutoFocus, onEscapeKeyDown, onPointerDownOutside, onOpenChange };

    React.useEffect(() => {
      const content = contentRef.current;
      if (!content || !open) return;
      const doc = content.ownerDocument;
      const layer = layerRef.current;
      const previouslyFocused = doc.activeElement as HTMLElement | null;
      let lastFocusedInside: HTMLElement | null = null;

      layerStack.push(layer);
      const releases: Array<() => void> = [];
      if (modal) {
        releases.push(lockScroll(doc));
        releases.push(hideOthers(overlayRef.current ? [content, overlayRef.current] : [content]));
      }

      // 1) 열릴 때 초기 포커스: 첫 번째 tabbable 요소, 없으면 Content 자체.
      const openEvent = new Event(OPEN_AUTO_FOCUS, { cancelable: true });
      callbacks.current.onOpenAutoFocus?.(openEvent);
      if (!openEvent.defaultPrevented && !content.contains(doc.activeElement)) {
        focus(getTabbableElements(content)[0] ?? content);
      }

      // 2) Esc로 닫기 (최상위 레이어만).
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key !== 'Escape' || !layerStack.isTop(layer)) return;
        callbacks.current.onEscapeKeyDown?.(event);
        if (!event.defaultPrevented) callbacks.current.onOpenChange(false);
      };

      // 3) 바깥 포인터 다운으로 닫기 (최상위 레이어만).
      const handlePointerDown = (event: PointerEvent) => {
        const target = event.target as Node | null;
        if (!target || content.contains(target) || !layerStack.isTop(layer)) return;
        // 비모달에서는 트리거 클릭이 토글을 담당하므로 여기서 닫지 않는다.
        if (triggerRef.current?.contains(target)) return;
        const outsideEvent: PointerDownOutsideEvent = new CustomEvent(POINTER_DOWN_OUTSIDE, {
          cancelable: true,
          detail: { originalEvent: event },
        });
        callbacks.current.onPointerDownOutside?.(outsideEvent);
        if (!outsideEvent.defaultPrevented) callbacks.current.onOpenChange(false);
      };

      // 4) 모달 포커스 트랩: 포커스가 바깥으로 새면 안으로 되돌린다.
      const handleFocusIn = (event: FocusEvent) => {
        const target = event.target as HTMLElement | null;
        if (!target) return;
        if (content.contains(target)) {
          lastFocusedInside = target;
          return;
        }
        if (modal && layerStack.isTop(layer)) {
          focus(lastFocusedInside ?? getTabbableElements(content)[0] ?? content);
        }
      };

      doc.addEventListener('keydown', handleKeyDown);
      doc.addEventListener('pointerdown', handlePointerDown);
      doc.addEventListener('focusin', handleFocusIn);

      return () => {
        doc.removeEventListener('keydown', handleKeyDown);
        doc.removeEventListener('pointerdown', handlePointerDown);
        doc.removeEventListener('focusin', handleFocusIn);
        layerStack.remove(layer);
        // inert를 먼저 해제해야 트리거로 포커스를 되돌릴 수 있다.
        for (const release of releases.reverse()) release();

        // 5) 닫힐 때 트리거(없으면 열기 직전 요소)로 포커스 복귀.
        const closeEvent = new Event(CLOSE_AUTO_FOCUS, { cancelable: true });
        callbacks.current.onCloseAutoFocus?.(closeEvent);
        if (!closeEvent.defaultPrevented) {
          const trigger = triggerRef.current;
          const returnTarget = trigger && trigger.isConnected ? trigger : previouslyFocused;
          focus(returnTarget);
          // 바깥 클릭으로 닫힌 경우 뒤따르는 mousedown 기본 동작이 포커스를 body로 옮기므로,
          // 그 직후 한 번 더 확인해 포커스가 갈 곳을 잃었으면 다시 되돌린다.
          setTimeout(() => {
            const active = doc.activeElement;
            if (!active || active === doc.body) focus(returnTarget);
          }, 0);
        }
      };
    }, [open, modal, triggerRef, overlayRef]);

    // Tab / Shift+Tab 순환 (모달 + 최상위 레이어일 때만).
    const handleTabKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
      const content = contentRef.current;
      if (!modal || !content || event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
      if (!layerStack.isTop(layerRef.current)) return;
      const tabbables = getTabbableElements(content);
      const first = tabbables[0];
      const last = tabbables[tabbables.length - 1];
      if (!first || !last) {
        event.preventDefault();
        return;
      }
      const active = content.ownerDocument.activeElement;
      if (event.shiftKey && (active === first || active === content)) {
        event.preventDefault();
        focus(last);
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        focus(first);
      }
    };

    const Comp = getComp('div', asChild);
    return (
      <Comp
        role="dialog"
        id={context.contentId}
        aria-modal={modal ? true : undefined}
        aria-labelledby={context.hasTitle ? context.titleId : undefined}
        aria-describedby={context.hasDescription ? context.descriptionId : undefined}
        tabIndex={-1}
        data-state={getState(open)}
        {...props}
        ref={ref}
        onKeyDown={composeEventHandlers(onKeyDown, handleTabKey)}
      />
    );
  },
);
DialogContentImpl.displayName = 'Dialog.ContentImpl';

/* -------------------------------------------------------------------------------------------------
 * Title / Description
 * -----------------------------------------------------------------------------------------------*/

export type DialogTitleProps = React.ComponentPropsWithoutRef<'h2'> & AsChildProps;

export const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ asChild, ...props }, forwardedRef) => {
    const { titleId, setHasTitle } = useDialogContext('Title');
    // 마운트 여부를 등록해 Content의 aria-labelledby가 존재하는 id만 가리키도록 한다.
    useIsomorphicLayoutEffect(() => {
      setHasTitle(true);
      return () => setHasTitle(false);
    }, [setHasTitle]);
    const Comp = getComp('h2', asChild);
    return <Comp id={titleId} {...props} ref={forwardedRef} />;
  },
);
DialogTitle.displayName = 'Dialog.Title';

export type DialogDescriptionProps = React.ComponentPropsWithoutRef<'p'> & AsChildProps;

export const DialogDescription = React.forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  ({ asChild, ...props }, forwardedRef) => {
    const { descriptionId, setHasDescription } = useDialogContext('Description');
    useIsomorphicLayoutEffect(() => {
      setHasDescription(true);
      return () => setHasDescription(false);
    }, [setHasDescription]);
    const Comp = getComp('p', asChild);
    return <Comp id={descriptionId} {...props} ref={forwardedRef} />;
  },
);
DialogDescription.displayName = 'Dialog.Description';

/* -------------------------------------------------------------------------------------------------
 * Close
 * -----------------------------------------------------------------------------------------------*/

export type DialogCloseProps = React.ComponentPropsWithoutRef<'button'> & AsChildProps;

export const DialogClose = React.forwardRef<HTMLButtonElement, DialogCloseProps>(
  ({ asChild, onClick, ...props }, forwardedRef) => {
    const context = useDialogContext('Close');
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
DialogClose.displayName = 'Dialog.Close';

/* -------------------------------------------------------------------------------------------------
 * 합성 컴포넌트용 짧은 이름
 * -----------------------------------------------------------------------------------------------*/

export {
  DialogRoot as Root,
  DialogTrigger as Trigger,
  DialogPortal as Portal,
  DialogOverlay as Overlay,
  DialogContent as Content,
  DialogTitle as Title,
  DialogDescription as Description,
  DialogClose as Close,
};
