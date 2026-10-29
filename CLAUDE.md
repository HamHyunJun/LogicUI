# LogicUI 작업 규칙

스타일 없이 동작·접근성·키보드 인터랙션만 제공하는 헤드리스 React UI 라이브러리 모노레포다.
이 파일의 규칙은 모든 작업에 적용된다.

## 언어

- 답변, 코드 주석, 커밋 메시지, PR 본문, changeset 설명은 모두 한국어로 쓴다.
- 식별자(변수·함수·타입·파일명)는 영어로 쓴다.

## 저장소 구조

| 경로 | 역할 |
| --- | --- |
| `packages/primitives` | `@logic-ui-kit/primitives`. 순수 헤드리스 로직 코어 |
| `packages/ui` | `@logic-ui-kit/ui`. primitives에 Tailwind 클래스만 입힌 레퍼런스 디자인 시스템 |
| `apps/docs` | Vite + React 플레이그라운드 (배포 대상 아님) |

의존 방향은 `docs → ui → primitives` 한 방향뿐이다. primitives는 다른 워크스페이스 패키지를 import하지 않는다.

## 명령어

```bash
pnpm install        # Node 22.22+, pnpm 10 (corepack enable)
pnpm dev            # 패키지 빌드 후 docs 실행
pnpm test           # 전체 테스트
pnpm typecheck      # 전체 타입 검사
pnpm build          # 전체 빌드
pnpm --filter @logic-ui-kit/primitives test   # 패키지 하나만
```

작업을 마치기 전에 `pnpm typecheck && pnpm test && pnpm build`가 모두 통과해야 한다.

## primitives 규칙 (가장 중요)

- **CSS 0%.** CSS 파일, `className` 기본값, 인라인 `style`을 넣지 않는다. 예외는 동작에 꼭 필요한 경우(예: 스크롤 잠금의 `body.style.overflow`)뿐이다.
- 런타임 의존성을 추가하지 않는다. `peerDependencies`는 `react`, `react-dom`만 둔다.
- 스타일링 훅은 `data-state="open" | "closed"` 같은 `data-*` 속성으로만 제공한다.
- 모든 컴포넌트는 **WAI-ARIA APG 패턴**을 따른다. 구현 전에 해당 패턴 문서(https://www.w3.org/WAI/ARIA/apg/patterns/)의 역할·속성·키보드 표를 확인하고, 그 표를 테스트로 옮긴다.

### 컴포넌트 API 형태

- 합성 컴포넌트 패턴을 쓴다: `Root`가 Context를 제공하고 하위 파트(`Trigger`, `Content` 등)가 소비한다.
- 파트를 Root 밖에서 쓰면 `<X.Part>은(는) <X.Root> 안에서만 사용할 수 있습니다.` 형태의 에러를 던진다.
- 상태는 제어(`value`/`open` + `onXxxChange`)와 비제어(`defaultXxx`)를 모두 지원하고, `src/shared/use-controllable-state.ts`를 쓴다.
- DOM을 렌더하는 파트는 모두 `forwardRef`, `asChild`(`src/shared/slot.tsx`), 네이티브 props 전달을 지원한다.
- 소비자 이벤트 핸들러는 `composeEventHandlers`로 합성해, 소비자가 `preventDefault()`하면 내부 동작을 건너뛴다.
- 기본 동작을 끌 수 있어야 하는 지점(Esc, 바깥 클릭, 자동 포커스)은 `onEscapeKeyDown` 같은 취소 가능한 콜백으로 연다.
- id는 `React.useId()`로 만들고, `aria-labelledby`/`aria-describedby`는 대상이 실제로 렌더될 때만 연결한다.
- SSR에서 깨지지 않게 한다: 렌더 중 `document`/`window` 접근 금지, 레이아웃 이펙트는 `useIsomorphicLayoutEffect`를 쓴다.
- 이펙트 안에서 쓰는 소비자 콜백은 ref에 최신값을 담아, 콜백이 바뀌어도 이펙트가 다시 돌지 않게 한다.

### 공통 로직 재사용

새로 만들기 전에 `packages/primitives/src/shared`에 있는 것부터 쓴다.

| 파일 | 용도 |
| --- | --- |
| `layer-stack.ts` | 중첩 레이어 중 최상위 판별 (Esc·바깥 클릭·포커스 트랩은 최상위만) |
| `hide-others.ts` | 모달 바깥 요소 `inert` 처리 (`aria-hidden`이 아니라 `inert`) |
| `scroll-lock.ts` | 참조 카운트 기반 body 스크롤 잠금 |
| `dom.ts` | 레이아웃에 의존하지 않는 tabbable 탐색, `focus()` |
| `slot.tsx` / `primitive.tsx` | `asChild` 구현 |
| `compose-refs.ts`, `compose-event-handlers.ts` | ref·핸들러 합성 |

두 컴포넌트 이상에서 쓰일 로직은 `shared`로 옮긴다. 컴포넌트 전용 로직은 컴포넌트 폴더에 둔다.

### 새 컴포넌트 추가 체크리스트

1. `packages/primitives/src/<name>/<name>.tsx`에 구현하고, `index.ts`에서 네임스페이스(`export * as Name`)와 개별 이름·Props 타입을 내보낸다.
2. `packages/primitives/src/index.ts`에 re-export를 추가한다.
3. `packages/primitives/tsup.config.ts`의 `entry`에 `'<name>/index'`를 추가한다.
4. `packages/primitives/package.json`의 `exports`에 `./<name>` 서브패스(import/require 각각 types·default)와 `typesVersions`를 추가한다.
5. `<name>.test.tsx`를 작성한다 (아래 테스트 규칙).
6. 필요하면 `packages/ui/src/<name>.tsx`에 스타일 버전을 추가하고, `apps/docs`에 예제(`examples.tsx`)와 페이지 데이터(`pages.tsx`: Props·키보드 표)를 추가한다.
7. `pnpm changeset`으로 변경 기록을 남긴다.

## 테스트 규칙

- Vitest + `@testing-library/react` + `@testing-library/user-event`, 환경은 jsdom.
- 요소는 역할과 접근 가능한 이름으로 찾는다 (`getByRole('button', { name: '열기' })`). `data-testid`는 역할이 없는 요소(예: Overlay)에만 쓴다.
- 상호작용은 `fireEvent`가 아니라 `userEvent.setup()`으로 실제 사용자처럼 시뮬레이션한다.
- 컴포넌트마다 최소한 다음을 검증한다:
  - APG 키보드 표의 모든 키
  - ARIA 역할·속성과 그 값의 변화
  - 포커스 이동(초기 포커스, 복귀, 트랩/로빙)
  - 제어·비제어 모드, `preventDefault()`로 기본 동작 취소
  - 열린/닫힌 상태 각각 `axe` 위반 없음 (jsdom에서는 `color-contrast` 규칙을 끈다)
- 테스트를 건너뛰거나(`skip`, `todo`) 지워서 통과시키지 않는다.
- jsdom에서 확인할 수 없는 동작(실제 포커스·클릭 순서, 위치·레이아웃 등)을 바꿨다면 `pnpm e2e`로 실제 Chromium에서 확인한다. `apps/docs/e2e`의 Playwright 테스트이며 CI에서도 돈다. 새 컴포넌트를 추가하면 여기에도 시나리오를 추가한다.

## ui 패키지 규칙

- 동작은 전부 primitives에 맡기고 `className`만 다룬다. 동작 로직이 필요하면 primitives에 먼저 추가한다.
- 클래스 병합은 `cn()`(clsx + tailwind-merge)을 써서 소비자 `className`이 기본값을 덮어쓰게 한다.
- 다크 모드는 `dark:` 변형을 함께 지정한다.
- primitives 타입을 그대로 추론하면 d.ts 빌드가 내부 청크 경로를 참조해 실패한다(TS2742). 내보내는 컴포넌트는 `React.ForwardRefExoticComponent<XxxProps & React.RefAttributes<El>>`처럼 공개 Props 타입으로 명시한다.

## TypeScript

- `tsconfig.base.json`의 `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`를 유지한다. 타입만 가져올 때는 `import type` / `type` 수식어를 쓴다.
- `any`와 `@ts-ignore`를 쓰지 않는다. 불가피하면 `unknown`과 좁히기, 또는 이유를 적은 `@ts-expect-error`를 쓴다.

## 빌드·패키징

- 라이브러리 패키지는 tsup으로 ESM(`.mjs`)·CJS(`.cjs`)·`.d.ts`·소스맵을 만든다.
- `"sideEffects": false`를 유지한다. 모듈 최상위에서 전역 상태를 바꾸는 코드를 넣지 않는다.
- `react`, `react-dom`, `react/jsx-runtime`, 워크스페이스 패키지는 번들에 넣지 않는다(`external`).
- `exports`를 바꾸면 `npx @arethetypeswrong/cli --pack packages/primitives`로 타입 해석을 확인한다.

## Git

- main에 직접 커밋하지 않는다. `feat/…`, `fix/…`, `docs/…` 브랜치에서 작업하고 PR로 머지한다.
- 커밋 메시지는 Conventional Commits 형식에 한국어 설명을 쓴다. 예: `feat(primitives): Popover 추가`
- 공개 API나 동작을 바꾸는 PR에는 changeset을 포함한다.
