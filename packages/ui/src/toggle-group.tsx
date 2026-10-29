import { ToggleGroup as ToggleGroupPrimitive, type ToggleGroupItemProps, type ToggleGroupRootProps } from '@logic-ui-kit/primitives/toggle-group';
import * as React from 'react';
import { cn } from './cn';

/*
 * @logic-ui-kit/primitives의 ToggleGroup에 Tailwind 스타일만 입힌 레퍼런스 구현.
 * 동작·접근성은 전부 프리미티브가 담당하고, 이 파일은 className만 다룬다.
 */

// 프리미티브 내부 타입 경로에 의존하지 않도록 공개 Props 타입으로 명시한다.
export const Root: React.ForwardRefExoticComponent<ToggleGroupRootProps & React.RefAttributes<HTMLDivElement>> = React.forwardRef<
  HTMLDivElement,
  ToggleGroupRootProps
>(({ className, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn(
      'inline-flex gap-1 rounded-xl bg-zinc-100 p-1 data-[orientation=vertical]:flex-col dark:bg-zinc-800',
      className,
    )}
    {...props}
  />
));
Root.displayName = 'ToggleGroup.Root';

export const Item: React.ForwardRefExoticComponent<ToggleGroupItemProps & React.RefAttributes<HTMLButtonElement>> = React.forwardRef<
  HTMLButtonElement,
  ToggleGroupItemProps
>(({ className, ...props }, ref) => (
  <ToggleGroupPrimitive.Item
    ref={ref}
    className={cn(
      'inline-flex h-8 cursor-pointer items-center justify-center rounded-lg px-3 text-sm font-medium text-zinc-600',
      'transition duration-150 active:scale-95 dark:text-zinc-400',
      'hover:text-zinc-900 dark:hover:text-zinc-50',
      'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-50',
      'data-[state=on]:bg-white data-[state=on]:text-zinc-900 data-[state=on]:shadow-sm',
      'dark:data-[state=on]:bg-zinc-950 dark:data-[state=on]:text-zinc-50',
      'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
      className,
    )}
    {...props}
  />
));
Item.displayName = 'ToggleGroup.Item';
