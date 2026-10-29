import { Tooltip as TooltipPrimitive, type TooltipContentProps } from '@logic-ui-kit/primitives/tooltip';
import * as React from 'react';
import { cn } from './cn';

/*
 * @logic-ui-kit/primitives의 Tooltip에 Tailwind 스타일만 입힌 레퍼런스 구현.
 * 동작·접근성·위치 계산은 전부 프리미티브가 담당하고, 이 파일은 className만 다룬다.
 */

// 스타일이 필요 없는 파트는 프리미티브를 그대로 재노출한다.
export { TooltipRoot as Root, TooltipTrigger as Trigger, TooltipPortal as Portal } from '@logic-ui-kit/primitives/tooltip';

// 프리미티브 내부 타입 경로에 의존하지 않도록 공개 Props 타입으로 명시한다.
export const Content: React.ForwardRefExoticComponent<TooltipContentProps & React.RefAttributes<HTMLDivElement>> = React.forwardRef<
  HTMLDivElement,
  TooltipContentProps
>(({ className, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    className={cn(
      'z-50 max-w-xs rounded-md bg-zinc-900 px-2.5 py-1.5 text-xs text-white shadow-md',
      'dark:bg-zinc-50 dark:text-zinc-900',
      'transition duration-150 starting:scale-95 starting:opacity-0',
      className,
    )}
    {...props}
  />
));
Content.displayName = 'Tooltip.Content';
