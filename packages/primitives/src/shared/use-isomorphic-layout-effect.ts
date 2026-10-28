import * as React from 'react';

/** SSR 환경에서 경고 없이 동작하는 useLayoutEffect. */
export const useIsomorphicLayoutEffect =
  typeof document !== 'undefined' ? React.useLayoutEffect : () => {};
