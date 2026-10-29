import {
  Toast as ToastPrimitive,
  type ToastActionProps,
  type ToastCloseProps,
  type ToastDescriptionProps,
  type ToastRootProps,
  type ToastTitleProps,
  type ToastViewportProps,
} from '@logic-ui-kit/primitives/toast';
import * as React from 'react';
import { cn } from './cn';

/*
 * @logic-ui-kit/primitives의 Toast에 Tailwind 스타일만 입힌 레퍼런스 구현.
 * 동작·접근성은 전부 프리미티브가 담당하고, 이 파일은 className만 다룬다.
 */

// 스타일이 필요 없는 파트는 프리미티브를 그대로 재노출한다.
export { ToastProvider as Provider } from '@logic-ui-kit/primitives/toast';

// 프리미티브 내부 타입 경로에 의존하지 않도록 공개 Props 타입으로 명시한다.
export const Viewport: React.ForwardRefExoticComponent<ToastViewportProps & React.RefAttributes<HTMLDivElement>> = React.forwardRef<
  HTMLDivElement,
  ToastViewportProps
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      'fixed right-4 bottom-4 z-[100] flex w-96 max-w-[calc(100vw-2rem)] flex-col gap-2 outline-none',
      className,
    )}
    {...props}
  />
));
Viewport.displayName = 'Toast.Viewport';

export const Root: React.ForwardRefExoticComponent<ToastRootProps & React.RefAttributes<HTMLDivElement>> = React.forwardRef<
  HTMLDivElement,
  ToastRootProps
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Root
    ref={ref}
    className={cn(
      'relative grid gap-1 rounded-xl border border-zinc-200 bg-white p-4 pr-10 text-sm text-zinc-900 shadow-lg',
      'dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50',
      'transition duration-200 starting:translate-y-2 starting:opacity-0',
      'data-[type=foreground]:border-red-300 dark:data-[type=foreground]:border-red-900',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-50',
      className,
    )}
    {...props}
  />
));
Root.displayName = 'Toast.Root';

export const Title: React.ForwardRefExoticComponent<ToastTitleProps & React.RefAttributes<HTMLDivElement>> = React.forwardRef<
  HTMLDivElement,
  ToastTitleProps
>(({ className, ...props }, ref) => <ToastPrimitive.Title ref={ref} className={cn('font-semibold', className)} {...props} />);
Title.displayName = 'Toast.Title';

export const Description: React.ForwardRefExoticComponent<ToastDescriptionProps & React.RefAttributes<HTMLDivElement>> = React.forwardRef<
  HTMLDivElement,
  ToastDescriptionProps
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description ref={ref} className={cn('text-zinc-600 dark:text-zinc-400', className)} {...props} />
));
Description.displayName = 'Toast.Description';

export const Action: React.ForwardRefExoticComponent<ToastActionProps & React.RefAttributes<HTMLButtonElement>> = React.forwardRef<
  HTMLButtonElement,
  ToastActionProps
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Action
    ref={ref}
    className={cn(
      'mt-2 inline-flex h-8 w-fit items-center rounded-lg border border-zinc-300 px-3 text-xs font-medium transition duration-150 active:scale-95',
      'hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-50',
      className,
    )}
    {...props}
  />
));
Action.displayName = 'Toast.Action';

/** 기본 내용은 ×이고 접근 가능한 이름은 "닫기"다. */
export const Close: React.ForwardRefExoticComponent<ToastCloseProps & React.RefAttributes<HTMLButtonElement>> = React.forwardRef<
  HTMLButtonElement,
  ToastCloseProps
>(({ className, children, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    aria-label="닫기"
    className={cn(
      'absolute top-2 right-2 inline-flex size-7 items-center justify-center rounded-md text-zinc-500 transition duration-150 active:scale-90',
      'hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50',
      'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-50',
      className,
    )}
    {...props}
  >
    {children ?? <span aria-hidden="true">×</span>}
  </ToastPrimitive.Close>
));
Close.displayName = 'Toast.Close';
