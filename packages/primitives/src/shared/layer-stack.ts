/**
 * 열린 모달 레이어의 스택. 중첩 다이얼로그에서 Esc·바깥 클릭·포커스 트랩이
 * 가장 위 레이어 하나에만 적용되도록 한다.
 */
const stack: object[] = [];

export const layerStack = {
  push(layer: object) {
    stack.push(layer);
  },
  remove(layer: object) {
    const index = stack.indexOf(layer);
    if (index !== -1) stack.splice(index, 1);
  },
  isTop(layer: object) {
    return stack[stack.length - 1] === layer;
  },
};
