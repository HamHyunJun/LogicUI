import * as React from 'react';
import { useComposedRefs } from '../shared/compose-refs';
import { focus } from '../shared/dom';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
  type DialogCloseProps,
  type DialogContentProps,
  type DialogRootProps,
} from '../dialog/dialog';

/*
 * WAI-ARIA APG Alert Dialog 패턴. Dialog 위에 다음 차이만 얹는다.
 *  - role="alertdialog" (항상 모달)
 *  - 바깥을 눌러도 닫히지 않는다. 사용자가 Cancel/Action으로 분명히 응답해야 한다. (Esc는 닫는다)
 *  - 열릴 때 가장 안전한 선택지인 Cancel에 포커스한다.
 */

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/

interface AlertDialogContextValue {
  cancelRef: React.RefObject<HTMLButtonElement | null>;
}

const AlertDialogContext = React.createContext<AlertDialogContextValue | null>(null);

function useAlertDialogContext(part: string): AlertDialogContextValue {
  const context = React.useContext(AlertDialogContext);
  if (!context) {
    throw new Error(`<AlertDialog.${part}>은(는) <AlertDialog.Root> 안에서만 사용할 수 있습니다.`);
  }
  return context;
}

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/

/** 알림 다이얼로그는 항상 모달이라 modal 옵션이 없다. */
export type AlertDialogRootProps = Omit<DialogRootProps, 'modal'>;

export function AlertDialogRoot(props: AlertDialogRootProps) {
  const cancelRef = React.useRef<HTMLButtonElement | null>(null);
  const context = React.useMemo<AlertDialogContextValue>(() => ({ cancelRef }), []);
  return (
    <AlertDialogContext.Provider value={context}>
      <DialogRoot {...props} modal />
    </AlertDialogContext.Provider>
  );
}
AlertDialogRoot.displayName = 'AlertDialog.Root';

/* -------------------------------------------------------------------------------------------------
 * Content
 * -----------------------------------------------------------------------------------------------*/

export type AlertDialogContentProps = Omit<DialogContentProps, 'onPointerDownOutside'>;

export const AlertDialogContent = React.forwardRef<HTMLDivElement, AlertDialogContentProps>(
  ({ onOpenAutoFocus, ...props }, forwardedRef) => {
    const { cancelRef } = useAlertDialogContext('Content');
    return (
      <DialogContent
        role="alertdialog"
        {...props}
        ref={forwardedRef}
        onOpenAutoFocus={(event) => {
          onOpenAutoFocus?.(event);
          // Cancel이 있으면 거기로, 없으면 Dialog의 기본 동작(첫 tabbable)을 따른다.
          if (!event.defaultPrevented && cancelRef.current) {
            event.preventDefault();
            focus(cancelRef.current);
          }
        }}
        // 바깥 클릭으로 닫히면 사용자가 의도하지 않은 응답이 될 수 있다.
        onPointerDownOutside={(event) => event.preventDefault()}
      />
    );
  },
);
AlertDialogContent.displayName = 'AlertDialog.Content';

/* -------------------------------------------------------------------------------------------------
 * Cancel / Action
 * -----------------------------------------------------------------------------------------------*/

export type AlertDialogCancelProps = DialogCloseProps;

/** 아무것도 하지 않고 닫는 버튼. 다이얼로그가 열릴 때 가장 먼저 포커스를 받는다. */
export const AlertDialogCancel = React.forwardRef<HTMLButtonElement, AlertDialogCancelProps>((props, forwardedRef) => {
  const { cancelRef } = useAlertDialogContext('Cancel');
  const ref = useComposedRefs(forwardedRef, cancelRef);
  return <DialogClose {...props} ref={ref} />;
});
AlertDialogCancel.displayName = 'AlertDialog.Cancel';

export type AlertDialogActionProps = DialogCloseProps;

/** 확정하는 버튼. 누르면 닫히며, 실제 동작은 onClick에서 처리한다. */
export const AlertDialogAction = React.forwardRef<HTMLButtonElement, AlertDialogActionProps>((props, forwardedRef) => {
  useAlertDialogContext('Action');
  return <DialogClose {...props} ref={forwardedRef} />;
});
AlertDialogAction.displayName = 'AlertDialog.Action';

/* -------------------------------------------------------------------------------------------------
 * Dialog에서 그대로 쓰는 파트
 * -----------------------------------------------------------------------------------------------*/

export { DialogTrigger as AlertDialogTrigger, DialogPortal as AlertDialogPortal, DialogOverlay as AlertDialogOverlay };
export { DialogTitle as AlertDialogTitle, DialogDescription as AlertDialogDescription };

export {
  AlertDialogRoot as Root,
  DialogTrigger as Trigger,
  DialogPortal as Portal,
  DialogOverlay as Overlay,
  AlertDialogContent as Content,
  DialogTitle as Title,
  DialogDescription as Description,
  AlertDialogCancel as Cancel,
  AlertDialogAction as Action,
};
