# primitives

**Parent context:** `../../AGENTS.md`
**Generated:** 2026-10-29 · **Updated:** 2026-10-29

## Purpose
`@logic-ui/primitives`. CSS 0%, 런타임 의존성 0의 헤드리스 로직 코어. 상태·포커스·키보드·ARIA만 담당하고 스타일링 훅은 `data-state="open" | "closed"`로만 노출한다. peerDependencies는 `react`, `react-dom`만 둔다.

## Key Files
| File | Description |
|------|-------------|
| `src/index.ts` | 패키지 루트 export (`./dialog`, `Slot`, `AsChildProps`) |
| `src/dialog/dialog.tsx` | Dialog 구현: Root·Trigger·Portal·Overlay·Content·Title·Description·Close |
| `src/dialog/index.ts` | `export * as Dialog` 네임스페이스 + 개별 이름·Props 타입 |
| `src/tabs/tabs.tsx` | Tabs: Root·List·Trigger·Content. 로빙 tabindex, automatic/manual 활성화, orientation |
| `src/accordion/accordion.tsx` | Accordion: Root·Item·Header·Trigger·Content. `value`는 항상 `string[]`, single/multiple, collapsible |
| `src/popover/popover.tsx` | Popover: 비모달 `role="dialog"`. Esc·바깥 포인터·포커스 이탈 닫기, 위치 계산 |
| `src/tooltip/tooltip.tsx` | Tooltip: `role="tooltip"`. 호버 지연(`delayDuration`)·유예(`closeDelay`), 포커스 즉시 열림, Esc |
| `src/*/index.ts` | 컴포넌트마다 네임스페이스(`export * as X`)와 개별 이름·Props 타입 export |
| `src/dialog/dialog.test.tsx` | APG 키보드·ARIA·포커스·제어/비제어·axe 테스트 |
| `tsup.config.ts` | 서브패스 엔트리 정의 (`index`, `dialog/index`), ESM/CJS/d.ts |
| `vitest.config.ts` | jsdom, `src/**/*.test.{ts,tsx}`, `test/setup.ts` |
| `test/setup.ts`, `test/vitest.d.ts` | jest-dom·vitest-axe 설정과 타입 보강 |
| `package.json` | `exports`(서브패스별 import/require·types), `typesVersions` |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `src/dialog/`, `src/tabs/`, `src/accordion/`, `src/popover/`, `src/tooltip/` | 컴포넌트별 구현과 테스트 |
| `src/shared/` | 컴포넌트 공용 로직 (아래 표) |
| `test/` | 테스트 셋업 |

### `src/shared/`
| File | Purpose |
|------|---------|
| `layer-stack.ts` | 중첩 레이어 중 최상위 판별 (Esc·바깥 클릭·포커스 트랩은 최상위만) |
| `hide-others.ts` | 모달 바깥 요소 `inert` 처리 |
| `scroll-lock.ts` | 참조 카운트 기반 body 스크롤 잠금 |
| `position.ts` | 순수 위치 계산(`computePosition`): 반대편 뒤집기 + 뷰포트 보정. 단위 테스트 있음 |
| `use-floating-position.ts` | content를 anchor 옆에 `position: fixed`로 배치, 스크롤·리사이즈 시 재계산, `data-side` 노출 |
| `portal.tsx` | SSR 안전한 포털 (Popover·Tooltip이 사용) |
| `dom.ts` | 레이아웃 비의존 tabbable 탐색, `focus()` |
| `slot.tsx`, `primitive.tsx` | `asChild` 구현 (`getComp`, `AsChildProps`) |
| `compose-refs.ts`, `compose-event-handlers.ts` | ref·핸들러 합성 (소비자가 `preventDefault()`하면 내부 동작 건너뜀) |
| `use-controllable-state.ts` | 제어/비제어 상태 |
| `use-isomorphic-layout-effect.ts` | SSR 안전한 레이아웃 이펙트 |

## For AI Agents

### Working In This Directory
- 새 컴포넌트는 `CLAUDE.md`의 "새 컴포넌트 추가 체크리스트"를 따른다. 특히 **`tsup.config.ts`의 `entry`와 `package.json`의 `exports`·`typesVersions`를 함께 수정**해야 서브패스 import가 동작한다.
- CSS 파일·`className` 기본값·인라인 `style` 금지 (스크롤 잠금 같은 동작 필수 예외만 허용).
- 두 컴포넌트 이상에서 쓰는 로직은 `src/shared/`로, 컴포넌트 전용 로직은 컴포넌트 폴더에 둔다.
- 렌더 중 `document`/`window` 접근 금지. 이펙트 안의 소비자 콜백은 ref에 최신값을 담아 이펙트 재실행을 막는다.
- 파트를 Root 밖에서 쓰면 `<X.Part>은(는) <X.Root> 안에서만 사용할 수 있습니다.` 에러를 던진다.

### Testing Requirements
- `pnpm --filter @logic-ui/primitives test` (Vitest + Testing Library + user-event + vitest-axe, jsdom).
- 역할·접근 가능한 이름으로 요소를 찾고 `userEvent.setup()`을 쓴다. 테스트를 `skip`/`todo`로 우회하지 않는다.
- `exports`를 바꾸면 `npx @arethetypeswrong/cli --pack packages/primitives`로 타입 해석을 확인한다.

### Common Patterns
- 컴포넌트 파일은 `Context → Root → 하위 파트` 순서의 구간 주석으로 나눈다.
- 취소 가능한 콜백(`onEscapeKeyDown`, `onPointerDownOutside`, `onOpenAutoFocus`, `onCloseAutoFocus` 등)으로 기본 동작을 열어 둔다.
- 서브패스 엔트리가 공개 타입(`Side`, `Align` 등)을 참조하면 그 엔트리의 `index.ts`에서 재내보내기 한다. 그렇지 않으면 d.ts 빌드가 경고(TS2742 위험)를 낸다.
- 가짜 타이머(`vi.useFakeTimers`)를 쓰는 테스트에서는 user-event가 멈춘다. `fireEvent`로 이벤트를 직접 보낸다 (`tooltip.test.tsx` 참고).
- 포털로 body에 붙는 요소를 axe로 검사할 때 `region` 규칙이 테스트 문서 구조 때문에 실패할 수 있다.
- 위치 계산의 한계는 코드에 `shortcut:`으로 표시되어 있다 (필요해지면 floating-ui 도입을 검토).

## Dependencies

### Internal
없음 (다른 워크스페이스 패키지를 import하지 않는다).

### External
- `react`, `react-dom` (peer, 번들 external)

## Manual Notes

Notes under this heading are written by humans and preserved on regeneration.
