import { Popover as PopoverPrimitive, type PopoverContentProps } from '@logic-ui-kit/primitives/popover';
import * as React from 'react';
import { cn } from './cn';

/*
 * @logic-ui-kit/primitives의 Popover에 Tailwind 스타일만 입힌 레퍼런스 구현.
 * 동작·접근성·위치 계산은 전부 프리미티브가 담당하고, 이 파일은 className만 다룬다.
 */

// 스타일이 필요 없는 파트는 프리미티브를 그대로 재노출한다.
export {
  PopoverRoot as Root,
  PopoverTrigger as Trigger,
  PopoverPortal as Portal,
  PopoverClose as Close,
} from '@logic-ui-kit/primitives/popover';

// 프리미티브 내부 타입 경로에 의존하지 않도록 공개 Props 타입으로 명시한다.
export const Content: React.ForwardRefExoticComponent<PopoverContentProps & React.RefAttributes<HTMLDivElement>> = React.forwardRef<
  HTMLDivElement,
  PopoverContentProps
>(({ className, ...props }, ref) => (
  <PopoverPrimitive.Content
    ref={ref}
    className={cn(
      'z-50 w-72 rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-900 shadow-lg',
      'dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50',
      'transition duration-150 starting:scale-95 starting:opacity-0',
      'focus-visible:outline-none',
      className,
    )}
    {...props}
  />
));
Content.displayName = 'Popover.Content';
