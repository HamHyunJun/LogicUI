/** 키보드 Tab 순서에 포함되는 요소를 찾기 위한 셀렉터. */
const TABBABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'audio[controls]',
  'video[controls]',
  'summary',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(',');

/**
 * container 안에서 Tab으로 도달 가능한 요소를 DOM 순서대로 반환한다.
 * 레이아웃 정보에 의존하지 않으므로 jsdom 등 테스트 환경에서도 동일하게 동작한다.
 */
export function getTabbableElements(container: HTMLElement): HTMLElement[] {
  const candidates = Array.from(container.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR));
  return candidates.filter((el) => {
    if (el.tabIndex < 0) return false;
    if (el.closest('[hidden],[inert]')) return false;
    const style = el.ownerDocument.defaultView?.getComputedStyle(el);
    if (style && (style.display === 'none' || style.visibility === 'hidden')) return false;
    return true;
  });
}

/** 요소에 포커스를 주되, 스크롤 점프를 막는다. */
export function focus(el: HTMLElement | null | undefined) {
  el?.focus({ preventScroll: true });
}
