import * as React from 'react';
import { createPortal } from 'react-dom';
import { useIsomorphicLayoutEffect } from './use-isomorphic-layout-effect';

export interface PortalProps {
  children?: React.ReactNode;
  /** 포털을 붙일 대상. 기본값은 document.body. */
  container?: Element | DocumentFragment | null;
}

/** SSR에서는 document가 없으므로 클라이언트 마운트 이후에만 포털을 만든다. */
export function Portal({ children, container }: PortalProps) {
  const [mounted, setMounted] = React.useState(false);
  useIsomorphicLayoutEffect(() => setMounted(true), []);
  return mounted ? createPortal(children, container ?? document.body) : null;
}
