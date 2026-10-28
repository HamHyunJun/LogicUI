/**
 * 소비자 핸들러를 먼저 호출하고, 소비자가 preventDefault() 하지 않았을 때만
 * 내부 핸들러를 실행한다. 소비자가 기본 동작을 끌 수 있는 통로가 된다.
 */
export function composeEventHandlers<E extends { defaultPrevented: boolean }>(
  externalHandler: ((event: E) => void) | undefined,
  internalHandler: (event: E) => void,
): (event: E) => void {
  return (event) => {
    externalHandler?.(event);
    if (!event.defaultPrevented) internalHandler(event);
  };
}
