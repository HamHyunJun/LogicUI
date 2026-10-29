import * as React from 'react';
import { getComp, type AsChildProps } from '../shared/primitive';

/*
 * WAI-ARIA APG Breadcrumb 패턴: nav landmark 안의 ol 목록, 현재 페이지에 aria-current="page".
 * 키보드는 링크의 기본 Tab 동작만 쓴다.
 */

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/

export type BreadcrumbRootProps = React.ComponentPropsWithoutRef<'nav'> & AsChildProps;

/** nav landmark. 여러 nav가 있는 페이지에서 구분되도록 aria-label을 둔다(기본값 "Breadcrumb", 번역해서 덮어쓸 수 있다). */
export const BreadcrumbRoot = React.forwardRef<HTMLElement, BreadcrumbRootProps>(({ asChild, ...props }, forwardedRef) => {
  const Comp = getComp('nav', asChild);
  return <Comp aria-label="Breadcrumb" {...props} ref={forwardedRef} />;
});
BreadcrumbRoot.displayName = 'Breadcrumb.Root';

/* -------------------------------------------------------------------------------------------------
 * List / Item
 * -----------------------------------------------------------------------------------------------*/

export type BreadcrumbListProps = React.ComponentPropsWithoutRef<'ol'> & AsChildProps;

export const BreadcrumbList = React.forwardRef<HTMLOListElement, BreadcrumbListProps>(({ asChild, ...props }, forwardedRef) => {
  const Comp = getComp('ol', asChild);
  return <Comp {...props} ref={forwardedRef} />;
});
BreadcrumbList.displayName = 'Breadcrumb.List';

export type BreadcrumbItemProps = React.ComponentPropsWithoutRef<'li'> & AsChildProps;

export const BreadcrumbItem = React.forwardRef<HTMLLIElement, BreadcrumbItemProps>(({ asChild, ...props }, forwardedRef) => {
  const Comp = getComp('li', asChild);
  return <Comp {...props} ref={forwardedRef} />;
});
BreadcrumbItem.displayName = 'Breadcrumb.Item';

/* -------------------------------------------------------------------------------------------------
 * Link / Page / Separator
 * -----------------------------------------------------------------------------------------------*/

export type BreadcrumbLinkProps = React.ComponentPropsWithoutRef<'a'> & AsChildProps;

/** 상위 페이지로 가는 링크. 라우터의 Link를 쓰려면 asChild로 넘긴다. */
export const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(({ asChild, ...props }, forwardedRef) => {
  const Comp = getComp('a', asChild);
  return <Comp {...props} ref={forwardedRef} />;
});
BreadcrumbLink.displayName = 'Breadcrumb.Link';

export type BreadcrumbPageProps = React.ComponentPropsWithoutRef<'span'> & AsChildProps;

/** 현재 페이지. 링크가 아니지만 보조기기에는 현재 위치의 링크로 읽히도록 aria-current="page"를 붙인다. */
export const BreadcrumbPage = React.forwardRef<HTMLSpanElement, BreadcrumbPageProps>(({ asChild, ...props }, forwardedRef) => {
  const Comp = getComp('span', asChild);
  return <Comp role="link" aria-disabled="true" aria-current="page" {...props} ref={forwardedRef} />;
});
BreadcrumbPage.displayName = 'Breadcrumb.Page';

export type BreadcrumbSeparatorProps = React.ComponentPropsWithoutRef<'li'> & AsChildProps;

/** 항목 사이의 구분자. 장식이므로 보조기기에서 숨긴다. 기본 내용은 "/". */
export const BreadcrumbSeparator = React.forwardRef<HTMLLIElement, BreadcrumbSeparatorProps>(
  ({ asChild, children, ...props }, forwardedRef) => {
    const Comp = getComp('li', asChild);
    return (
      <Comp role="presentation" aria-hidden="true" {...props} ref={forwardedRef}>
        {children ?? '/'}
      </Comp>
    );
  },
);
BreadcrumbSeparator.displayName = 'Breadcrumb.Separator';

export {
  BreadcrumbRoot as Root,
  BreadcrumbList as List,
  BreadcrumbItem as Item,
  BreadcrumbLink as Link,
  BreadcrumbPage as Page,
  BreadcrumbSeparator as Separator,
};
