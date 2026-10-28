/**
 * 모달 바깥의 요소들을 `inert`로 만들어 보조기술과 포인터/포커스에서 숨긴다.
 * (aria-hidden 대신 inert를 쓰는 이유: 숨겨진 영역 안의 포커스 가능한 요소까지
 *  확실히 비활성화되어 axe의 aria-hidden-focus 위반이 생기지 않는다.)
 *
 * keep에 포함된 요소(예: Content, Overlay)와 그 조상은 남기고, 조상들의 형제만 숨긴다.
 * 같은 요소를 여러 모달이 동시에 숨길 수 있으므로 참조 카운트로 관리한다.
 */
const counts = new WeakMap<Element, number>();
const preexisting = new WeakSet<Element>();

export function hideOthers(keep: Element[]): () => void {
  const keepSet = new Set<Element>();
  for (const el of keep) {
    let node: Element | null = el;
    while (node) {
      keepSet.add(node);
      node = node.parentElement;
    }
  }

  const toHide = new Set<Element>();
  for (const kept of keepSet) {
    const parent = kept.parentElement;
    // html의 자식(head/body)은 건드리지 않는다.
    if (!parent || parent === kept.ownerDocument.documentElement) continue;
    for (const sibling of Array.from(parent.children)) {
      if (keepSet.has(sibling) || sibling.tagName === 'SCRIPT' || sibling.tagName === 'STYLE') continue;
      toHide.add(sibling);
    }
  }

  for (const el of toHide) {
    const count = counts.get(el) ?? 0;
    if (count === 0) {
      if (el.hasAttribute('inert')) preexisting.add(el);
      else el.setAttribute('inert', '');
    }
    counts.set(el, count + 1);
  }

  return () => {
    for (const el of toHide) {
      const count = (counts.get(el) ?? 1) - 1;
      counts.set(el, count);
      if (count === 0) {
        if (preexisting.has(el)) preexisting.delete(el);
        else el.removeAttribute('inert');
      }
    }
  };
}
