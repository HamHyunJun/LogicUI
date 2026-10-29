import {
  Accordion as AccordionPrimitive,
  type AccordionContentProps,
  type AccordionItemProps,
  type AccordionTriggerProps,
} from '@logic-ui/primitives/accordion';
import * as React from 'react';
import { cn } from './cn';

/*
 * @logic-ui/primitives의 Accordion에 Tailwind 스타일만 입힌 레퍼런스 구현.
 * 동작·접근성은 전부 프리미티브가 담당하고, 이 파일은 className만 다룬다.
 */

// 스타일이 필요 없는 파트는 프리미티브를 그대로 재노출한다.
export { AccordionRoot as Root, AccordionHeader as Header } from '@logic-ui/primitives/accordion';

// 프리미티브 내부 타입 경로에 의존하지 않도록 공개 Props 타입으로 명시한다.
export const Item: React.ForwardRefExoticComponent<AccordionItemProps & React.RefAttributes<HTMLDivElement>> = React.forwardRef<
  HTMLDivElement,
  AccordionItemProps
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn('border-b border-zinc-200 dark:border-zinc-800', className)}
    {...props}
  />
));
Item.displayName = 'Accordion.Item';

export const Trigger: React.ForwardRefExoticComponent<AccordionTriggerProps & React.RefAttributes<HTMLButtonElement>> = React.forwardRef<
  HTMLButtonElement,
  AccordionTriggerProps
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Trigger
    ref={ref}
    className={cn(
      'group flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium transition-colors',
      'hover:text-zinc-600 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none',
      'disabled:pointer-events-none disabled:opacity-50 dark:hover:text-zinc-300',
      className,
    )}
    {...props}
  >
    {children}
    <span aria-hidden="true" className="transition-transform duration-200 group-data-[state=open]:rotate-180">
      ▾
    </span>
  </AccordionPrimitive.Trigger>
));
Trigger.displayName = 'Accordion.Trigger';

export const Content: React.ForwardRefExoticComponent<AccordionContentProps & React.RefAttributes<HTMLDivElement>> = React.forwardRef<
  HTMLDivElement,
  AccordionContentProps
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn('pb-4 text-sm text-zinc-600 dark:text-zinc-400', className)}
    {...props}
  />
));
Content.displayName = 'Accordion.Content';
