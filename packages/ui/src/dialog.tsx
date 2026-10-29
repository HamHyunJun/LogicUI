import {
  Dialog as DialogPrimitive,
  type DialogContentProps,
  type DialogDescriptionProps,
  type DialogOverlayProps,
  type DialogTitleProps,
} from '@logic-ui-kit/primitives/dialog';
import * as React from 'react';
import { cn } from './cn';

/*
 * @logic-ui-kit/primitives의 Dialog에 Tailwind 스타일만 입힌 레퍼런스 구현.
 * 동작·접근성은 전부 프리미티브가 담당하고, 이 파일은 className만 다룬다.
 * 진입 애니메이션은 Tailwind v4의 starting: 변형(@starting-style)으로 처리한다.
 */

// 스타일이 필요 없는 파트는 프리미티브를 그대로 재노출한다.
export {
  DialogRoot as Root,
  DialogTrigger as Trigger,
  DialogPortal as Portal,
  DialogClose as Close,
} from '@logic-ui-kit/primitives/dialog';

// 프리미티브 내부 타입 경로에 의존하지 않도록 공개 Props 타입으로 명시한다.
export const Overlay: React.ForwardRefExoticComponent<DialogOverlayProps & React.RefAttributes<HTMLDivElement>> = React.forwardRef<
  HTMLDivElement,
  DialogOverlayProps
>(
  ({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        'fixed inset-0 z-50 bg-zinc-950/50 backdrop-blur-sm transition-opacity duration-200 starting:opacity-0',
        className,
      )}
      {...props}
    />
  ),
);
Overlay.displayName = 'Dialog.Overlay';

export const Content: React.ForwardRefExoticComponent<DialogContentProps & React.RefAttributes<HTMLDivElement>> = React.forwardRef<
  HTMLDivElement,
  DialogContentProps
>(
  ({ className, ...props }, ref) => (
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4',
        'rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-2xl',
        'dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50',
        'transition duration-200 starting:scale-95 starting:opacity-0',
        'focus-visible:outline-none',
        className,
      )}
      {...props}
    />
  ),
);
Content.displayName = 'Dialog.Content';

export const Header = ({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('flex flex-col gap-1.5', className)} {...props} />
);
Header.displayName = 'Dialog.Header';

export const Footer = ({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props} />
);
Footer.displayName = 'Dialog.Footer';

export const Title: React.ForwardRefExoticComponent<DialogTitleProps & React.RefAttributes<HTMLHeadingElement>> = React.forwardRef<
  HTMLHeadingElement,
  DialogTitleProps
>(
  ({ className, ...props }, ref) => (
    <DialogPrimitive.Title ref={ref} className={cn('text-lg font-semibold tracking-tight', className)} {...props} />
  ),
);
Title.displayName = 'Dialog.Title';

export const Description: React.ForwardRefExoticComponent<DialogDescriptionProps & React.RefAttributes<HTMLParagraphElement>> = React.forwardRef<
  HTMLParagraphElement,
  DialogDescriptionProps
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-zinc-600 dark:text-zinc-400', className)}
    {...props}
  />
));
Description.displayName = 'Dialog.Description';
