import * as React from 'react';
import { computePosition, type PositionOptions } from './position';
import { useIsomorphicLayoutEffect } from './use-isomorphic-layout-effect';

/**
 * content를 anchor 옆에 position: fixed로 배치한다. 마운트된 동안 스크롤·리사이즈마다 다시 계산한다.
 * 위치는 리렌더 없이 스타일로 직접 적용하며, 실제로 놓인 방향을 data-side로 노출한다.
 * content가 마운트되는 컴포넌트 안에서 호출해야 한다.
 */
export function useFloatingPosition(
  anchorRef: React.RefObject<HTMLElement | null>,
  contentRef: React.RefObject<HTMLElement | null>,
  { side, align, sideOffset }: PositionOptions,
): void {
  useIsomorphicLayoutEffect(() => {
    const content = contentRef.current;
    const anchor = anchorRef.current;
    const win = content?.ownerDocument.defaultView;
    if (!content || !anchor || !win) return;

    const update = (): void => {
      // 이전 위치가 크기 측정(줄바꿈)에 영향을 주지 않도록 원점에서 잰다.
      content.style.position = 'fixed';
      content.style.top = '0px';
      content.style.left = '0px';
      // transform(진입 애니메이션의 scale 등)이 반영되지 않도록 레이아웃 크기로 잰다.
      const size = { width: content.offsetWidth, height: content.offsetHeight };
      const viewport = { width: win.innerWidth, height: win.innerHeight };
      const next = computePosition(anchor.getBoundingClientRect(), size, viewport, { side, align, sideOffset });
      content.style.top = `${next.top}px`;
      content.style.left = `${next.left}px`;
      content.dataset.side = next.side;
    };

    update();
    win.addEventListener('resize', update);
    content.ownerDocument.addEventListener('scroll', update, true);
    return () => {
      win.removeEventListener('resize', update);
      content.ownerDocument.removeEventListener('scroll', update, true);
    };
  }, [anchorRef, contentRef, side, align, sideOffset]);
}
