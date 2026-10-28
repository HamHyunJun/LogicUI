import * as React from 'react';

interface UseControllableStateParams<T> {
  prop?: T | undefined;
  defaultProp: T;
  onChange?: ((value: T) => void) | undefined;
}

/**
 * 제어(prop 전달) / 비제어(defaultProp) 모드를 모두 지원하는 상태 훅.
 * 값이 실제로 바뀔 때만 onChange를 호출한다.
 */
export function useControllableState<T>({
  prop,
  defaultProp,
  onChange,
}: UseControllableStateParams<T>): [T, (next: T) => void] {
  const [uncontrolled, setUncontrolled] = React.useState(defaultProp);
  const isControlled = prop !== undefined;
  const value = isControlled ? prop : uncontrolled;

  // 최신 onChange를 ref로 보관해 setter의 참조를 안정적으로 유지한다.
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;
  const valueRef = React.useRef(value);
  valueRef.current = value;

  const setValue = React.useCallback(
    (next: T) => {
      if (Object.is(next, valueRef.current)) return;
      if (!isControlled) setUncontrolled(next);
      onChangeRef.current?.(next);
    },
    [isControlled],
  );

  return [value, setValue];
}
