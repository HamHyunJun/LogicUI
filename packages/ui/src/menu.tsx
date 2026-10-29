import {
  Menu as MenuPrimitive,
  type MenuCheckboxItemProps,
  type MenuContentProps,
  type MenuItemProps,
  type MenuRadioItemProps,
  type MenuSeparatorProps,
} from '@logic-ui-kit/primitives/menu';
import * as React from 'react';
import { cn } from './cn';

/*
 * @logic-ui-kit/primitives의 Menu에 Tailwind 스타일만 입힌 레퍼런스 구현.
 * 동작·접근성·위치 계산은 전부 프리미티브가 담당하고, 이 파일은 className만 다룬다.
 */

// 스타일이 필요 없는 파트는 프리미티브를 그대로 재노출한다.
export {
  MenuRoot as Root,
  MenuTrigger as Trigger,
  MenuPortal as Portal,
  MenuRadioGroup as RadioGroup,
} from '@logic-ui-kit/primitives/menu';

const itemClassName = [
  'relative flex cursor-default select-none items-center rounded-lg px-3 py-2 text-sm outline-none',
  'transition-colors duration-100',
  'focus:bg-zinc-100 dark:focus:bg-zinc-800',
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
].join(' ');

// 체크 표시는 텍스트가 아니라 SVG로 그려 글자 탐색(typeahead)에 쓰이는 textContent에 섞이지 않게 한다.
const Indicator = ({ children }: { children: React.ReactNode }) => (
  <span
    aria-hidden="true"
    className="invisible absolute left-3 inline-flex size-4 items-center justify-center group-data-[state=checked]:visible"
  >
    {children}
  </span>
);

const CheckIcon = () => (
  <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.5 8.5l3 3 6-7" />
  </svg>
);

const DotIcon = () => (
  <svg viewBox="0 0 16 16" className="size-4" fill="currentColor">
    <circle cx="8" cy="8" r="2.5" />
  </svg>
);

// 프리미티브 내부 타입 경로에 의존하지 않도록 공개 Props 타입으로 명시한다.
export const Content: React.ForwardRefExoticComponent<MenuContentProps & React.RefAttributes<HTMLDivElement>> = React.forwardRef<
  HTMLDivElement,
  MenuContentProps
>(({ className, ...props }, ref) => (
  <MenuPrimitive.Content
    ref={ref}
    className={cn(
      'z-50 min-w-48 rounded-xl border border-zinc-200 bg-white p-1 text-zinc-900 shadow-lg',
      'dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50',
      'transition duration-150 starting:scale-95 starting:opacity-0',
      'focus-visible:outline-none',
      className,
    )}
    {...props}
  />
));
Content.displayName = 'Menu.Content';

export const Item: React.ForwardRefExoticComponent<MenuItemProps & React.RefAttributes<HTMLDivElement>> = React.forwardRef<
  HTMLDivElement,
  MenuItemProps
>(({ className, ...props }, ref) => <MenuPrimitive.Item ref={ref} className={cn(itemClassName, className)} {...props} />);
Item.displayName = 'Menu.Item';

export const CheckboxItem: React.ForwardRefExoticComponent<MenuCheckboxItemProps & React.RefAttributes<HTMLDivElement>> =
  React.forwardRef<HTMLDivElement, MenuCheckboxItemProps>(({ className, children, ...props }, ref) => (
    <MenuPrimitive.CheckboxItem ref={ref} className={cn('group pl-9', itemClassName, className)} {...props}>
      <Indicator>
        <CheckIcon />
      </Indicator>
      {children}
    </MenuPrimitive.CheckboxItem>
  ));
CheckboxItem.displayName = 'Menu.CheckboxItem';

export const RadioItem: React.ForwardRefExoticComponent<MenuRadioItemProps & React.RefAttributes<HTMLDivElement>> = React.forwardRef<
  HTMLDivElement,
  MenuRadioItemProps
>(({ className, children, ...props }, ref) => (
  <MenuPrimitive.RadioItem ref={ref} className={cn('group pl-9', itemClassName, className)} {...props}>
    <Indicator>
      <DotIcon />
    </Indicator>
    {children}
  </MenuPrimitive.RadioItem>
));
RadioItem.displayName = 'Menu.RadioItem';

export const Separator: React.ForwardRefExoticComponent<MenuSeparatorProps & React.RefAttributes<HTMLDivElement>> = React.forwardRef<
  HTMLDivElement,
  MenuSeparatorProps
>(({ className, ...props }, ref) => (
  <MenuPrimitive.Separator ref={ref} className={cn('-mx-1 my-1 h-px bg-zinc-200 dark:bg-zinc-800', className)} {...props} />
));
Separator.displayName = 'Menu.Separator';
