import {
  Breadcrumb as BreadcrumbPrimitive,
  type BreadcrumbItemProps,
  type BreadcrumbLinkProps,
  type BreadcrumbListProps,
  type BreadcrumbPageProps,
  type BreadcrumbRootProps,
  type BreadcrumbSeparatorProps,
} from '@logic-ui-kit/primitives/breadcrumb';
import * as React from 'react';
import { cn } from './cn';

/*
 * @logic-ui-kit/primitives의 Breadcrumb에 Tailwind 스타일만 입힌 레퍼런스 구현.
 * 구조와 접근성은 프리미티브가 담당하고, 이 파일은 className만 다룬다.
 */

// 프리미티브 내부 타입 경로에 의존하지 않도록 공개 Props 타입으로 명시한다.
export const Root: React.ForwardRefExoticComponent<BreadcrumbRootProps & React.RefAttributes<HTMLElement>> = React.forwardRef<
  HTMLElement,
  BreadcrumbRootProps
>(({ className, ...props }, ref) => <BreadcrumbPrimitive.Root ref={ref} className={cn('text-sm', className)} {...props} />);
Root.displayName = 'Breadcrumb.Root';

export const List: React.ForwardRefExoticComponent<BreadcrumbListProps & React.RefAttributes<HTMLOListElement>> = React.forwardRef<
  HTMLOListElement,
  BreadcrumbListProps
>(({ className, ...props }, ref) => (
  <BreadcrumbPrimitive.List ref={ref} className={cn('flex flex-wrap items-center gap-1.5 text-zinc-500 dark:text-zinc-400', className)} {...props} />
));
List.displayName = 'Breadcrumb.List';

export const Item: React.ForwardRefExoticComponent<BreadcrumbItemProps & React.RefAttributes<HTMLLIElement>> = React.forwardRef<
  HTMLLIElement,
  BreadcrumbItemProps
>(({ className, ...props }, ref) => <BreadcrumbPrimitive.Item ref={ref} className={cn('inline-flex items-center', className)} {...props} />);
Item.displayName = 'Breadcrumb.Item';

export const Link: React.ForwardRefExoticComponent<BreadcrumbLinkProps & React.RefAttributes<HTMLAnchorElement>> = React.forwardRef<
  HTMLAnchorElement,
  BreadcrumbLinkProps
>(({ className, ...props }, ref) => (
  <BreadcrumbPrimitive.Link
    ref={ref}
    className={cn(
      'rounded-sm transition-colors duration-150 hover:text-zinc-900 dark:hover:text-zinc-50',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-50',
      className,
    )}
    {...props}
  />
));
Link.displayName = 'Breadcrumb.Link';

export const Page: React.ForwardRefExoticComponent<BreadcrumbPageProps & React.RefAttributes<HTMLSpanElement>> = React.forwardRef<
  HTMLSpanElement,
  BreadcrumbPageProps
>(({ className, ...props }, ref) => <BreadcrumbPrimitive.Page ref={ref} className={cn('font-medium text-zinc-900 dark:text-zinc-50', className)} {...props} />);
Page.displayName = 'Breadcrumb.Page';

export const Separator: React.ForwardRefExoticComponent<BreadcrumbSeparatorProps & React.RefAttributes<HTMLLIElement>> = React.forwardRef<
  HTMLLIElement,
  BreadcrumbSeparatorProps
>(({ className, ...props }, ref) => <BreadcrumbPrimitive.Separator ref={ref} className={cn('select-none text-zinc-400 dark:text-zinc-600', className)} {...props} />);
Separator.displayName = 'Breadcrumb.Separator';
