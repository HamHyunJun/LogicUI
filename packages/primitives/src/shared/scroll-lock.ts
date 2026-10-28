/**
 * body 스크롤 잠금. 중첩된 모달이 여러 개여도 마지막 하나가 닫힐 때만 해제되도록
 * 참조 카운트로 관리한다. 스크롤바가 사라지며 레이아웃이 밀리지 않도록 padding을 보정한다.
 */
let lockCount = 0;
let saved: { overflow: string; paddingRight: string } | null = null;

export function lockScroll(doc: Document = document): () => void {
  const body = doc.body;
  if (lockCount === 0) {
    const scrollbarWidth = (doc.defaultView?.innerWidth ?? 0) - doc.documentElement.clientWidth;
    saved = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      const current = Number.parseFloat(doc.defaultView?.getComputedStyle(body).paddingRight ?? '0') || 0;
      body.style.paddingRight = `${current + scrollbarWidth}px`;
    }
  }
  lockCount++;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    lockCount--;
    if (lockCount === 0 && saved) {
      body.style.overflow = saved.overflow;
      body.style.paddingRight = saved.paddingRight;
      saved = null;
    }
  };
}
