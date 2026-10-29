import {
  Tabs as TabsPrimitive,
  type TabsContentProps,
  type TabsListProps,
  type TabsTriggerProps,
} from '@logic-ui-kit/primitives/tabs';
import * as React from 'react';
import { cn } from './cn';

/*
 * @logic-ui-kit/primitives의 Tabs에 Tailwind 스타일만 입힌 레퍼런스 구현.
 * 동작·접근성은 전부 프리미티브가 담당하고, 이 파일은 className만 다룬다.
 */

// 스타일이 필요 없는 파트는 프리미티브를 그대로 재노출한다.
export { TabsRoot as Root } from '@logic-ui-kit/primitives/tabs';

// 프리미티브 내부 타입 경로에 의존하지 않도록 공개 Props 타입으로 명시한다.
export const List: React.ForwardRefExoticComponent<TabsListProps & React.RefAttributes<HTMLDivElement>> = React.forwardRef<
  HTMLDivElement,
  TabsListProps
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex gap-1 rounded-xl bg-zinc-100 p-1 data-[orientation=vertical]:flex-col dark:bg-zinc-800',
      className,
    )}
    {...props}
  />
));
List.displayName = 'Tabs.List';

export const Trigger: React.ForwardRefExoticComponent<TabsTriggerProps & React.RefAttributes<HTMLButtonElement>> = React.forwardRef<
  HTMLButtonElement,
  TabsTriggerProps
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors duration-150',
      'hover:text-zinc-900 data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm',
      'focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none',
      'disabled:pointer-events-none disabled:opacity-50',
      'dark:text-zinc-400 dark:hover:text-zinc-50 dark:data-[state=active]:bg-zinc-950 dark:data-[state=active]:text-zinc-50',
      className,
    )}
    {...props}
  />
));
Trigger.displayName = 'Tabs.Trigger';

export const Content: React.ForwardRefExoticComponent<TabsContentProps & React.RefAttributes<HTMLDivElement>> = React.forwardRef<
  HTMLDivElement,
  TabsContentProps
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-3 rounded-xl border border-zinc-200 p-4 text-sm dark:border-zinc-800',
      'focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none',
      className,
    )}
    {...props}
  />
));
Content.displayName = 'Tabs.Content';
