export type Side = 'top' | 'right' | 'bottom' | 'left';
export type Align = 'start' | 'center' | 'end';

export interface PositionOptions {
  side: Side;
  align: Align;
  sideOffset: number;
}

interface Size {
  width: number;
  height: number;
}

interface Point {
  top: number;
  left: number;
}

const OPPOSITE: Record<Side, Side> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

const place = (anchor: DOMRect, size: Size, side: Side, align: Align, offset: number): Point => {
  let top = 0;
  let left = 0;
  if (side === 'top' || side === 'bottom') {
    top = side === 'top' ? anchor.top - size.height - offset : anchor.bottom + offset;
    left = align === 'start' ? anchor.left : align === 'end' ? anchor.right - size.width : anchor.left + (anchor.width - size.width) / 2;
  } else {
    left = side === 'left' ? anchor.left - size.width - offset : anchor.right + offset;
    top = align === 'start' ? anchor.top : align === 'end' ? anchor.bottom - size.height : anchor.top + (anchor.height - size.height) / 2;
  }
  return { top, left };
};

const overflowsMainAxis = (point: Point, size: Size, side: Side, viewport: Size): boolean => {
  if (side === 'top') return point.top < 0;
  if (side === 'bottom') return point.top + size.height > viewport.height;
  if (side === 'left') return point.left < 0;
  return point.left + size.width > viewport.width;
};

/**
 * 앵커 기준으로 뷰포트(position: fixed) 좌표를 계산한다.
 * 주축으로 넘치면 반대편이 들어맞을 때 뒤집고, 마지막에 뷰포트 안으로 밀어 넣는다.
 * shortcut: 화살표·크기 제한(max-height)·중첩 스크롤 컨테이너 클리핑은 다루지 않는다, 필요해지면 floating-ui 도입.
 */
export function computePosition(
  anchor: DOMRect,
  size: Size,
  viewport: Size,
  { side, align, sideOffset }: PositionOptions,
): Point & { side: Side } {
  let resolvedSide = side;
  let point = place(anchor, size, side, align, sideOffset);
  if (overflowsMainAxis(point, size, side, viewport)) {
    const flipped = place(anchor, size, OPPOSITE[side], align, sideOffset);
    if (!overflowsMainAxis(flipped, size, OPPOSITE[side], viewport)) {
      point = flipped;
      resolvedSide = OPPOSITE[side];
    }
  }
  return {
    side: resolvedSide,
    top: Math.max(0, Math.min(point.top, viewport.height - size.height)),
    left: Math.max(0, Math.min(point.left, viewport.width - size.width)),
  };
}
