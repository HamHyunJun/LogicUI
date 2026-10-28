import 'vitest';

// vitest-axe의 매처 타입을 현재 Vitest의 Assertion 인터페이스에 등록한다.
interface AxeMatchers<R = unknown> {
  toHaveNoViolations(): R;
}

declare module 'vitest' {
  interface Assertion<T = any> extends AxeMatchers<T> {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
