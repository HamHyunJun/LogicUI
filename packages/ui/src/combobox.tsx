import {
  Combobox as ComboboxPrimitive,
  type ComboboxContentProps,
  type ComboboxInputProps,
  type ComboboxItemProps,
} from '@logic-ui-kit/primitives/combobox';
import * as React from 'react';
import { cn } from './cn';

/*
 * @logic-ui-kit/primitives의 Combobox에 Tailwind 스타일만 입힌 레퍼런스 구현.
 * 동작·접근성·위치 계산은 전부 프리미티브가 담당하고, 이 파일은 className만 다룬다.
 */

// 스타일이 필요 없는 파트는 프리미티브를 그대로 재노출한다.
export { ComboboxRoot as Root, ComboboxPortal as Portal } from '@logic-ui-kit/primitives/combobox';

// 프리미티브 내부 타입 경로에 의존하지 않도록 공개 Props 타입으로 명시한다.
export const Input: React.ForwardRefExoticComponent<ComboboxInputProps & React.RefAttributes<HTMLInputElement>> = React.forwardRef<
  HTMLInputElement,
  ComboboxInputProps
>(({ className, ...props }, ref) => (
  <ComboboxPrimitive.Input
    ref={ref}
    className={cn(
      'h-10 w-full min-w-48 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-500',
      'transition duration-150',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-50',
      'dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-400',
      'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
      className,
    )}
    {...props}
  />
));
Input.displayName = 'Combobox.Input';

export const Content: React.ForwardRefExoticComponent<ComboboxContentProps & React.RefAttributes<HTMLDivElement>> = React.forwardRef<
  HTMLDivElement,
  ComboboxContentProps
>(({ className, ...props }, ref) => (
  <ComboboxPrimitive.Content
    ref={ref}
    className={cn(
      'z-50 max-h-60 min-w-[var(--logicui-combobox-input-width)] overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1 text-zinc-900 shadow-lg',
      'dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50',
      'transition duration-150 starting:scale-95 starting:opacity-0',
      className,
    )}
    {...props}
  />
));
Content.displayName = 'Combobox.Content';

export const Item: React.ForwardRefExoticComponent<ComboboxItemProps & React.RefAttributes<HTMLDivElement>> = React.forwardRef<
  HTMLDivElement,
  ComboboxItemProps
>(({ className, children, ...props }, ref) => (
  <ComboboxPrimitive.Item
    ref={ref}
    className={cn(
      'group relative flex cursor-default select-none items-center rounded-lg py-2 pr-3 pl-8 text-sm outline-none',
      'data-[highlighted]:bg-zinc-100 dark:data-[highlighted]:bg-zinc-800',
      'data-[state=checked]:font-medium data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    {...props}
  >
    <span aria-hidden="true" className="invisible absolute left-2.5 inline-flex size-4 items-center justify-center group-data-[state=checked]:visible">
      <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.5 8.5l3 3 6-7" />
      </svg>
    </span>
    {children}
  </ComboboxPrimitive.Item>
));
Item.displayName = 'Combobox.Item';
