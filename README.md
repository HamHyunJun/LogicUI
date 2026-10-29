# LogicUI

스타일(CSS) 없이 **동작 메커니즘, WAI-ARIA 접근성, 키보드 인터랙션**만 제공하는 헤드리스 UI 라이브러리 모노레포입니다.

**[데모 보기 →](https://logicui.vercel.app)** — 컴포넌트별 플레이그라운드와 키보드 인터랙션 표

| 패키지 | 설명 |
| --- | --- |
| [`@logic-ui-kit/primitives`](packages/primitives) | 순수 헤드리스 로직 코어. CSS 0%, 상태·포커스·키보드·ARIA만 담당 |
| [`@logic-ui-kit/ui`](packages/ui) | primitives에 Tailwind CSS 스타일을 입힌 레퍼런스 디자인 시스템 |
| [`apps/docs`](apps/docs) | Vite + React 기반 인터랙티브 문서·플레이그라운드 |

## 설치

```bash
pnpm add @logic-ui-kit/primitives   # 스타일 없는 헤드리스 컴포넌트
pnpm add @logic-ui-kit/ui           # Tailwind 스타일 버전 (primitives 포함)
```

`react`, `react-dom` 18 이상이 필요합니다. 서브패스로 필요한 컴포넌트만 가져올 수 있습니다(`@logic-ui-kit/primitives/dialog`).

`@logic-ui-kit/ui`는 CSS를 번들하지 않고 Tailwind v4 클래스만 씁니다. 사용하는 앱의 CSS에서 패키지를 스캔하도록 등록하세요.

```css
@import 'tailwindcss';

/* CSS 파일 기준 node_modules 상대 경로 */
@source '../node_modules/@logic-ui-kit/ui/dist';

/* 클래스 기반 다크 모드를 쓸 때 */
@custom-variant dark (&:where(.dark, .dark *));
```

```tsx
import { Dialog, Button } from '@logic-ui-kit/ui';
```

## 개발 환경

> Node 20은 2026년 4월에 지원이 종료되었고, Vitest 5 · tsup 9 · jsdom 30이 Node 22.22 이상을 요구하므로 최소 버전을 22.22로 둡니다.

```bash
corepack enable          # pnpm 활성화 (Node 22.22+)
pnpm install
pnpm dev                 # 패키지 빌드 후 문서 사이트 실행
pnpm test                # 전체 테스트 (Vitest + Testing Library + vitest-axe)
pnpm build               # 전체 빌드 (Turborepo)
```

## 컴포넌트

| 컴포넌트 | 서브패스 | 구성 | APG 패턴 |
| --- | --- | --- | --- |
| Dialog | `@logic-ui-kit/primitives/dialog` | Root · Trigger · Portal · Overlay · Content · Title · Description · Close | [Modal Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) |
| Tabs | `@logic-ui-kit/primitives/tabs` | Root · List · Trigger · Content | [Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) |
| Accordion | `@logic-ui-kit/primitives/accordion` | Root · Item · Header · Trigger · Content | [Accordion](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/) |
| Popover | `@logic-ui-kit/primitives/popover` | Root · Trigger · Portal · Content · Close | 비모달 Dialog |
| Tooltip | `@logic-ui-kit/primitives/tooltip` | Root · Trigger · Portal · Content | [Tooltip](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) |

모든 컴포넌트는 합성 컴포넌트(`Root` + 하위 파트), 제어·비제어 상태, `asChild`, `forwardRef`, 스타일링용 `data-*` 속성, 취소 가능한 콜백(`preventDefault()`)을 공통으로 지원합니다.
Popover와 Tooltip의 위치 계산은 자체 구현이라 화살표·max-height·스크롤 컨테이너 클리핑은 지원하지 않습니다.

### Dialog

```tsx
import { Dialog } from '@logic-ui-kit/primitives/dialog';

<Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
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

[WAI-ARIA APG Modal Dialog 패턴](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)을 따릅니다.

- `role="dialog"`, `aria-modal`, `aria-labelledby`(Title), `aria-describedby`(Description) 자동 연결
- Trigger에 `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`
- 열리면 첫 포커스 가능 요소로 포커스, Tab / Shift+Tab 순환(포커스 트랩), 닫히면 트리거로 포커스 복귀
- Esc·바깥 클릭으로 닫기 (`onEscapeKeyDown`, `onPointerDownOutside`에서 `preventDefault()`로 막기 가능)
- 모달 동안 바깥 요소 `inert` 처리, body 스크롤 잠금(스크롤바 폭 보정)
- 중첩 다이얼로그: Esc·바깥 클릭·포커스 트랩은 가장 위 레이어에만 적용
- 제어(`open`/`onOpenChange`) · 비제어(`defaultOpen`) 모드, `modal={false}` 비모달 모드
- 모든 파트에 `asChild` 지원, 스타일링용 `data-state="open" | "closed"`

## 배포

`pnpm changeset`으로 변경 기록을 남기고 main에 머지하면 Release 워크플로가 버전 업 PR을 열고,
그 PR이 머지되면 npm에 배포합니다. 저장소 시크릿에 `NPM_TOKEN`(`@logic-ui-kit` 스코프 쓰기 권한)이 필요합니다.

Settings → Actions → General의 **Allow GitHub Actions to create and approve pull requests**가 꺼져 있으면 버전 업 PR이 자동으로 만들어지지 않습니다. 이때는 `changeset-release/main` 브랜치에서 `main`으로 PR을 직접 엽니다.
