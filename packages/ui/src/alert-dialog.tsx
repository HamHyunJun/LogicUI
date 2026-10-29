import {
  AlertDialog as AlertDialogPrimitive,
  type AlertDialogContentProps,
} from '@logic-ui-kit/primitives/alert-dialog';
import * as React from 'react';
import { cn } from './cn';

/*
 * @logic-ui-kit/primitives의 AlertDialog에 Tailwind 스타일만 입힌 레퍼런스 구현.
 * Overlay·Header·Footer·Title·Description은 ui Dialog의 것을 그대로 쓴다. Content만 알림용으로 좁게 만든다.
 */

export { Overlay, Header, Footer, Title, Description } from './dialog';

// 스타일이 필요 없는 파트는 프리미티브를 그대로 재노출한다.
export {
  AlertDialogRoot as Root,
  AlertDialogTrigger as Trigger,
  AlertDialogPortal as Portal,
  AlertDialogCancel as Cancel,
  AlertDialogAction as Action,
} from '@logic-ui-kit/primitives/alert-dialog';

// 프리미티브 내부 타입 경로에 의존하지 않도록 공개 Props 타입으로 명시한다.
export const Content: React.ForwardRefExoticComponent<AlertDialogContentProps & React.RefAttributes<HTMLDivElement>> = React.forwardRef<
  HTMLDivElement,
  AlertDialogContentProps
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Content
    ref={ref}
    className={cn(
      'fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-4',
      'rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-2xl',
      'dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50',
      'transition duration-200 starting:scale-95 starting:opacity-0',
      'focus-visible:outline-none',
      className,
    )}
    {...props}
  />
));
Content.displayName = 'AlertDialog.Content';
