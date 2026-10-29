import { Switch as SwitchPrimitive, type SwitchRootProps, type SwitchThumbProps } from '@logic-ui-kit/primitives/switch';
import * as React from 'react';
import { cn } from './cn';

/*
 * @logic-ui-kit/primitives의 Switch에 Tailwind 스타일만 입힌 레퍼런스 구현.
 * 동작·접근성은 전부 프리미티브가 담당하고, 이 파일은 className만 다룬다.
 */

// 프리미티브 내부 타입 경로에 의존하지 않도록 공개 Props 타입으로 명시한다.
export const Root: React.ForwardRefExoticComponent<SwitchRootProps & React.RefAttributes<HTMLButtonElement>> = React.forwardRef<
  HTMLButtonElement,
  SwitchRootProps
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      'inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-zinc-300 p-0.5',
      'transition-colors duration-200 active:scale-95',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-50',
      'data-[state=checked]:bg-zinc-900 dark:bg-zinc-700 dark:data-[state=checked]:bg-zinc-50',
      'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
      className,
    )}
    {...props}
  />
));
Root.displayName = 'Switch.Root';

export const Thumb: React.ForwardRefExoticComponent<SwitchThumbProps & React.RefAttributes<HTMLSpanElement>> = React.forwardRef<
  HTMLSpanElement,
  SwitchThumbProps
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Thumb
    ref={ref}
    className={cn(
      'pointer-events-none block size-5 rounded-full bg-white shadow-sm',
      'transition-transform duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
      'data-[state=checked]:translate-x-5 dark:data-[state=checked]:bg-zinc-900',
      className,
    )}
    {...props}
  />
));
Thumb.displayName = 'Switch.Thumb';
