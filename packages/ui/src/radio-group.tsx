import {
  RadioGroup as RadioGroupPrimitive,
  type RadioGroupIndicatorProps,
  type RadioGroupItemProps,
  type RadioGroupRootProps,
} from '@logic-ui-kit/primitives/radio-group';
import * as React from 'react';
import { cn } from './cn';

/*
 * @logic-ui-kit/primitives의 RadioGroup에 Tailwind 스타일만 입힌 레퍼런스 구현.
 * 동작·접근성은 전부 프리미티브가 담당하고, 이 파일은 className만 다룬다.
 * Item은 선택 점(Indicator)을 기본으로 렌더한다.
 */

// 프리미티브 내부 타입 경로에 의존하지 않도록 공개 Props 타입으로 명시한다.
export const Root: React.ForwardRefExoticComponent<RadioGroupRootProps & React.RefAttributes<HTMLDivElement>> = React.forwardRef<
  HTMLDivElement,
  RadioGroupRootProps
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn('grid gap-3 data-[orientation=horizontal]:grid-flow-col data-[orientation=horizontal]:justify-start', className)}
    {...props}
  />
));
Root.displayName = 'RadioGroup.Root';

export const Item: React.ForwardRefExoticComponent<RadioGroupItemProps & React.RefAttributes<HTMLButtonElement>> = React.forwardRef<
  HTMLButtonElement,
  RadioGroupItemProps
>(({ className, children, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      'inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full border border-zinc-400 bg-white',
      'transition-colors duration-150 active:scale-90',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-50',
      'data-[state=checked]:border-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:data-[state=checked]:border-zinc-50',
      'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
      className,
    )}
    {...props}
  >
    {children ?? <Indicator />}
  </RadioGroupPrimitive.Item>
));
Item.displayName = 'RadioGroup.Item';

export const Indicator: React.ForwardRefExoticComponent<RadioGroupIndicatorProps & React.RefAttributes<HTMLSpanElement>> = React.forwardRef<
  HTMLSpanElement,
  RadioGroupIndicatorProps
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Indicator
    ref={ref}
    className={cn(
      'block size-2.5 rounded-full bg-zinc-900 transition duration-150 starting:scale-50 starting:opacity-0 dark:bg-zinc-50',
      className,
    )}
    {...props}
  />
));
Indicator.displayName = 'RadioGroup.Indicator';
