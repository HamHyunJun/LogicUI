import { Checkbox as CheckboxPrimitive, type CheckboxRootProps, type CheckboxIndicatorProps } from '@logic-ui-kit/primitives/checkbox';
import * as React from 'react';
import { cn } from './cn';

/*
 * @logic-ui-kit/primitives의 Checkbox에 Tailwind 스타일만 입힌 레퍼런스 구현.
 * 동작·접근성은 전부 프리미티브가 담당하고, 이 파일은 className만 다룬다.
 * Root는 체크·중간 상태 아이콘이 든 Indicator를 기본으로 렌더한다.
 */

// 프리미티브 내부 타입 경로에 의존하지 않도록 공개 Props 타입으로 명시한다.
export const Root: React.ForwardRefExoticComponent<CheckboxRootProps & React.RefAttributes<HTMLButtonElement>> = React.forwardRef<
  HTMLButtonElement,
  CheckboxRootProps
>(({ className, children, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-md border border-zinc-400 bg-white text-white',
      'transition-colors duration-150 active:scale-90',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-50',
      'data-[state=checked]:border-zinc-900 data-[state=checked]:bg-zinc-900 data-[state=indeterminate]:border-zinc-900 data-[state=indeterminate]:bg-zinc-900',
      'dark:border-zinc-600 dark:bg-zinc-900 dark:data-[state=checked]:border-zinc-50 dark:data-[state=checked]:bg-zinc-50 dark:data-[state=checked]:text-zinc-900',
      'dark:data-[state=indeterminate]:border-zinc-50 dark:data-[state=indeterminate]:bg-zinc-50 dark:data-[state=indeterminate]:text-zinc-900',
      'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
      className,
    )}
    {...props}
  >
    {children ?? (
      <Indicator>
        <svg viewBox="0 0 16 16" className="size-3.5 group-data-[state=indeterminate]:hidden" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3.5 8.5l3 3 6-7" />
        </svg>
        <svg viewBox="0 0 16 16" className="hidden size-3.5 group-data-[state=indeterminate]:block" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M4 8h8" />
        </svg>
      </Indicator>
    )}
  </CheckboxPrimitive.Root>
));
Root.displayName = 'Checkbox.Root';

export const Indicator: React.ForwardRefExoticComponent<CheckboxIndicatorProps & React.RefAttributes<HTMLSpanElement>> = React.forwardRef<
  HTMLSpanElement,
  CheckboxIndicatorProps
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Indicator ref={ref} className={cn('group flex items-center justify-center', className)} {...props} />
));
Indicator.displayName = 'Checkbox.Indicator';
