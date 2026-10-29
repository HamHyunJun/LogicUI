# @logic-ui-kit/primitives

스타일(CSS) 없이 **동작, WAI-ARIA 접근성, 키보드 인터랙션**만 제공하는 헤드리스 React 컴포넌트입니다.

**[데모 보기 →](https://logicui.vercel.app)**

- CSS 0%, 런타임 의존성 0 (`react`, `react-dom`만 peer)
- [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/patterns/) 패턴의 역할·속성·키보드 표를 따르고 테스트로 검증
- 합성 컴포넌트(`Root` + 하위 파트), 제어·비제어 상태, `asChild`, `forwardRef`
- 스타일링은 `data-state="open" | "closed"` 같은 `data-*` 속성으로
- `preventDefault()`로 Esc·바깥 클릭 등 기본 동작을 취소할 수 있는 콜백

## 설치

```bash
pnpm add @logic-ui-kit/primitives
```

`react`, `react-dom` 18 이상이 필요합니다. 컴포넌트마다 서브패스로 가져옵니다.

## 사용

```tsx
import { Dialog } from '@logic-ui-kit/primitives/dialog';

<Dialog.Root>
  <Dialog.Trigger>열기</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <Dialog.Title>제목</Dialog.Title>
      <Dialog.Description>내용</Dialog.Description>
      <Dialog.Close>닫기</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>;
```

## 컴포넌트

| 컴포넌트 | 서브패스 | APG 패턴 |
| --- | --- | --- |
| Dialog | `@logic-ui-kit/primitives/dialog` | [Modal Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) |
| Tabs | `@logic-ui-kit/primitives/tabs` | [Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) |
| Accordion | `@logic-ui-kit/primitives/accordion` | [Accordion](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/) |
| Popover | `@logic-ui-kit/primitives/popover` | 비모달 Dialog |
| Tooltip | `@logic-ui-kit/primitives/tooltip` | [Tooltip](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) |
| Menu | `@logic-ui-kit/primitives/menu` | [Menu Button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/) |
| Switch | `@logic-ui-kit/primitives/switch` | [Switch](https://www.w3.org/WAI/ARIA/apg/patterns/switch/) |
| Checkbox | `@logic-ui-kit/primitives/checkbox` | [Checkbox](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/) |
| RadioGroup | `@logic-ui-kit/primitives/radio-group` | [Radio Group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) |
| Progress | `@logic-ui-kit/primitives/progress` | WAI-ARIA progressbar 역할 |
| ToggleGroup | `@logic-ui-kit/primitives/toggle-group` | [Button (toggle)](https://www.w3.org/WAI/ARIA/apg/patterns/button/) |
| Breadcrumb | `@logic-ui-kit/primitives/breadcrumb` | [Breadcrumb](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/) |
| Slider | `@logic-ui-kit/primitives/slider` | [Slider](https://www.w3.org/WAI/ARIA/apg/patterns/slider/) |
| AlertDialog | `@logic-ui-kit/primitives/alert-dialog` | [Alert Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/) |
| Toast | `@logic-ui-kit/primitives/toast` | WAI-ARIA live region |
| Select | `@logic-ui-kit/primitives/select` | [Select-Only Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/) |
| Combobox | `@logic-ui-kit/primitives/combobox` | [Editable Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/) |

Popover·Tooltip·Menu·Select·Combobox의 위치 계산은 자체 구현이라 화살표·max-height·스크롤 컨테이너 클리핑은 지원하지 않습니다. Menu는 서브메뉴를, Slider는 범위(다중 썸)를, Select는 그룹을 지원하지 않습니다. Menu·Select의 글자 탐색(typeahead)은 IME 조합 입력(예: 한글)에서 동작하지 않습니다.

스타일이 입혀진 버전은 [`@logic-ui-kit/ui`](https://www.npmjs.com/package/@logic-ui-kit/ui)를 보세요.

## 라이선스

MIT
