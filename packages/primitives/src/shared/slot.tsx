import * as React from 'react';
import { composeRefs } from './compose-refs';

/**
 * asChild 패턴 구현체. 자식 엘리먼트에 Slot의 props와 ref를 병합해 렌더한다.
 * - 이벤트 핸들러: 자식 → Slot 순서로 모두 호출
 * - className: 공백으로 이어 붙임
 * - style: 얕은 병합 (자식 우선)
 */
export const Slot = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }>(
  (props, forwardedRef) => {
    const { children, ...slotProps } = props;
    if (!React.isValidElement(children)) {
      return React.Children.count(children) > 1 ? React.Children.only(null) : null;
    }
    const child = children as React.ReactElement<Record<string, unknown>>;
    const merged = mergeProps(slotProps as Record<string, unknown>, child.props);
    return React.cloneElement(child, {
      ...merged,
      ref: forwardedRef ? composeRefs(forwardedRef, getElementRef(child)) : getElementRef(child),
    });
  },
);
Slot.displayName = 'Slot';

function mergeProps(slotProps: Record<string, unknown>, childProps: Record<string, unknown>) {
  const result: Record<string, unknown> = { ...slotProps };
  for (const key of Object.keys(childProps)) {
    const slotValue = slotProps[key];
    const childValue = childProps[key];
    if (/^on[A-Z]/.test(key) && typeof slotValue === 'function' && typeof childValue === 'function') {
      result[key] = (...args: unknown[]) => {
        (childValue as (...a: unknown[]) => void)(...args);
        (slotValue as (...a: unknown[]) => void)(...args);
      };
    } else if (key === 'style' && typeof slotValue === 'object' && typeof childValue === 'object') {
      result[key] = { ...(slotValue as object), ...(childValue as object) };
    } else if (key === 'className') {
      result[key] = [slotValue, childValue].filter(Boolean).join(' ');
    } else if (childValue !== undefined) {
      result[key] = childValue;
    }
  }
  return result;
}

/** React 18(element.ref)과 19(props.ref) 모두에서 자식의 ref를 읽는다. */
function getElementRef(element: React.ReactElement): React.Ref<unknown> | undefined {
  const propsRef = (element.props as { ref?: React.Ref<unknown> }).ref;
  if (Number.parseInt(React.version, 10) >= 19) return propsRef;
  return (element as unknown as { ref?: React.Ref<unknown> }).ref;
}
