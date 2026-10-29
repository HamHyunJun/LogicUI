import {
  Slider as SliderPrimitive,
  type SliderRangeProps,
  type SliderRootProps,
  type SliderThumbProps,
  type SliderTrackProps,
} from '@logic-ui-kit/primitives/slider';
import * as React from 'react';
import { cn } from './cn';

/*
 * @logic-ui-kit/primitives의 Slider에 Tailwind 스타일만 입힌 레퍼런스 구현.
 * 위치는 프리미티브가 Root에 노출하는 CSS 변수(--logicui-slider-percent)로 그린다.
 */

// 프리미티브 내부 타입 경로에 의존하지 않도록 공개 Props 타입으로 명시한다.
export const Root: React.ForwardRefExoticComponent<SliderRootProps & React.RefAttributes<HTMLDivElement>> = React.forwardRef<
  HTMLDivElement,
  SliderRootProps
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex h-5 w-full touch-none items-center select-none',
      'data-[orientation=vertical]:h-40 data-[orientation=vertical]:w-5 data-[orientation=vertical]:justify-center',
      'data-[disabled]:opacity-50',
      className,
    )}
    {...props}
  />
));
Root.displayName = 'Slider.Root';

export const Track: React.ForwardRefExoticComponent<SliderTrackProps & React.RefAttributes<HTMLDivElement>> = React.forwardRef<
  HTMLDivElement,
  SliderTrackProps
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Track
    ref={ref}
    className={cn(
      'relative h-1.5 w-full grow overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800',
      'data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5',
      className,
    )}
    {...props}
  />
));
Track.displayName = 'Slider.Track';

export const Range: React.ForwardRefExoticComponent<SliderRangeProps & React.RefAttributes<HTMLDivElement>> = React.forwardRef<
  HTMLDivElement,
  SliderRangeProps
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Range
    ref={ref}
    className={cn(
      'absolute h-full w-[var(--logicui-slider-percent)] bg-zinc-900 dark:bg-zinc-50',
      'data-[orientation=vertical]:bottom-0 data-[orientation=vertical]:h-[var(--logicui-slider-percent)] data-[orientation=vertical]:w-full',
      className,
    )}
    {...props}
  />
));
Range.displayName = 'Slider.Range';

export const Thumb: React.ForwardRefExoticComponent<SliderThumbProps & React.RefAttributes<HTMLSpanElement>> = React.forwardRef<
  HTMLSpanElement,
  SliderThumbProps
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Thumb
    ref={ref}
    className={cn(
      'absolute left-[var(--logicui-slider-percent)] block size-5 -translate-x-1/2 cursor-grab rounded-full border-2 border-zinc-900 bg-white shadow-sm',
      'transition-transform duration-150 hover:scale-110 active:scale-95 active:cursor-grabbing',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-50',
      'dark:border-zinc-50 dark:bg-zinc-900',
      'data-[orientation=vertical]:bottom-[var(--logicui-slider-percent)] data-[orientation=vertical]:left-1/2 data-[orientation=vertical]:translate-y-1/2',
      'data-[disabled]:cursor-not-allowed',
      className,
    )}
    {...props}
  />
));
Thumb.displayName = 'Slider.Thumb';
