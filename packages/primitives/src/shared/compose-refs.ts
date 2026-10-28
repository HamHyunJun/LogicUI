import * as React from 'react';

type PossibleRef<T> = React.Ref<T> | undefined;

/** 함수형/객체형 ref 하나에 값을 할당한다. */
function setRef<T>(ref: PossibleRef<T>, value: T | null) {
  if (typeof ref === 'function') {
    ref(value);
  } else if (ref !== null && ref !== undefined) {
    (ref as React.MutableRefObject<T | null>).current = value;
  }
}

/** 여러 ref를 하나의 콜백 ref로 합친다. */
export function composeRefs<T>(...refs: PossibleRef<T>[]): React.RefCallback<T> {
  return (node) => {
    for (const ref of refs) setRef(ref, node);
  };
}

/** 렌더마다 새 함수가 생기지 않도록 메모이즈한 composeRefs. */
export function useComposedRefs<T>(...refs: PossibleRef<T>[]): React.RefCallback<T> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useCallback(composeRefs(...refs), refs);
}
