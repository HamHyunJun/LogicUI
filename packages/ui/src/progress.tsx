import { Progress as ProgressPrimitive, type ProgressIndicatorProps, type ProgressRootProps } from '@logic-ui-kit/primitives/progress';
import * as React from 'react';
import { cn } from './cn';

/*
 * @logic-ui-kit/primitives의 Progress에 Tailwind 스타일만 입힌 레퍼런스 구현.
 * 동작·접근성은 프리미티브가 담당한다. 막대는 CSS 변수(--progress)만큼 Indicator를 translate해서 그리고,
 * 값을 알 수 없을 때(indeterminate)는 Tailwind 기본 animate-pulse를 쓴다(앱 CSS에 keyframes를 요구하지 않는다).
 */

// 프리미티브 내부 타입 경로에 의존하지 않도록 공개 Props 타입으로 명시한다.
export const Root: React.ForwardRefExoticComponent<ProgressRootProps & React.RefAttributes<HTMLDivElement>> = React.forwardRef<
  HTMLDivElement,
  ProgressRootProps
>(({ className, style, value, max = 100, ...props }, ref) => {
  const percent = typeof value === 'number' && value >= 0 && value <= max ? (value / max) * 100 : undefined;
  return (
    <ProgressPrimitive.Root
      ref={ref}
      value={value}
      max={max}
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800', className)}
      style={{ ['--progress' as string]: percent === undefined ? '0%' : `${percent}%`, ...style }}
      {...props}
    />
  );
});
Root.displayName = 'Progress.Root';

export const Indicator: React.ForwardRefExoticComponent<ProgressIndicatorProps & React.RefAttributes<HTMLDivElement>> = React.forwardRef<
  HTMLDivElement,
  ProgressIndicatorProps
>(({ className, ...props }, ref) => (
  <ProgressPrimitive.Indicator
    ref={ref}
    className={cn(
      'h-full w-full origin-left rounded-full bg-zinc-900 transition-transform duration-300 ease-out dark:bg-zinc-50',
      'data-[state=loading]:translate-x-[calc(var(--progress)-100%)]',
      'data-[state=indeterminate]:animate-pulse',
      className,
    )}
    {...props}
  />
));
Indicator.displayName = 'Progress.Indicator';
