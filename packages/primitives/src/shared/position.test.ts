import { describe, expect, it } from 'vitest';
import { computePosition } from './position';

const viewport = { width: 1000, height: 800 };
const size = { width: 100, height: 50 };
const rect = (left: number, top: number, width = 80, height = 30): DOMRect =>
  ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) }) as DOMRect;
const options = { side: 'bottom', align: 'center', sideOffset: 4 } as const;

describe('computePosition', () => {
  it('bottom/center: 앵커 아래 가운데에 놓는다', () => {
    const result = computePosition(rect(400, 100), size, viewport, options);
    expect(result).toEqual({ side: 'bottom', top: 134, left: 390 });
  });

  it('top, left, right 방향과 start/end 정렬을 계산한다', () => {
    expect(computePosition(rect(400, 300), size, viewport, { ...options, side: 'top' })).toMatchObject({ top: 246, left: 390 });
    expect(computePosition(rect(400, 300), size, viewport, { ...options, side: 'left', align: 'start' })).toMatchObject({ top: 300, left: 296 });
    expect(computePosition(rect(400, 300), size, viewport, { ...options, side: 'right', align: 'end' })).toMatchObject({ top: 280, left: 484 });
    expect(computePosition(rect(400, 300), size, viewport, { ...options, align: 'start' })).toMatchObject({ left: 400 });
    expect(computePosition(rect(400, 300), size, viewport, { ...options, align: 'end' })).toMatchObject({ left: 380 });
  });

  it('주축으로 넘치면 반대편으로 뒤집는다', () => {
    const result = computePosition(rect(400, 10), size, viewport, { ...options, side: 'top' });
    expect(result.side).toBe('bottom');
    expect(result.top).toBe(44);
  });

  it('반대편도 들어가지 않으면 뒤집지 않는다', () => {
    const tiny = { width: 100, height: 50 };
    const result = computePosition(rect(400, 10), tiny, { width: 1000, height: 60 }, { ...options, side: 'top' });
    expect(result.side).toBe('top');
  });

  it('교차축으로 넘치면 뷰포트 안으로 민다', () => {
    expect(computePosition(rect(0, 100, 20), size, viewport, options).left).toBe(0);
    expect(computePosition(rect(990, 100, 10), size, viewport, options).left).toBe(900);
  });
});
