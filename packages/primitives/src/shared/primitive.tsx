import * as React from 'react';
import { Slot } from './slot';

/** 모든 프리미티브 파트가 공통으로 받는 asChild 옵션. */
export interface AsChildProps {
  /** true면 자체 DOM 엘리먼트 대신 유일한 자식 엘리먼트에 props/동작을 위임한다. */
  asChild?: boolean;
}

/** asChild 여부에 따라 기본 태그 또는 Slot을 반환한다. */
export function getComp(tag: 'button' | 'div' | 'h2' | 'p', asChild: boolean | undefined): React.ElementType {
  return asChild ? Slot : tag;
}
