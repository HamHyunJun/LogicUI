# ui

**Parent context:** `../../AGENTS.md`
**Generated:** 2026-10-29 · **Updated:** 2026-10-29

## Purpose
`@logic-ui/ui`. `@logic-ui/primitives` 위에 Tailwind CSS 클래스만 입힌 레퍼런스 디자인 시스템. 동작·접근성은 전부 primitives가 담당하고 이 패키지는 `className`만 다룬다.

## Key Files
| File | Description |
|------|-------------|
| `src/index.ts` | export: `Dialog`·`Tabs`·`Accordion`·`Popover`·`Tooltip`(네임스페이스), `Button`, `ButtonProps`, `cn` |
| `src/dialog.tsx` | primitives Dialog에 스타일 입힘. Trigger·Portal·Close·Root는 그대로 재노출, Overlay·Content·Title·Description은 스타일 래핑, Header·Footer는 신규 |
| `src/tabs.tsx`, `src/accordion.tsx`, `src/popover.tsx`, `src/tooltip.tsx` | 같은 방식으로 primitives에 스타일만 입힌 래퍼. 스타일이 필요 없는 파트는 그대로 재노출 |
| `src/button.tsx` | `primary`/`secondary`/`ghost` variant 버튼. `Dialog.Trigger asChild`와 함께 사용 |
| `src/cn.ts` | `clsx` + `tailwind-merge` |
| `src/dialog.test.tsx` | 스타일 래퍼 테스트 |
| `tsup.config.ts` | ESM/CJS/d.ts. `@logic-ui/*`, `clsx`, `tailwind-merge`는 external |

## For AI Agents

### Working In This Directory
- 동작 로직이 필요하면 primitives에 먼저 추가한다. 여기서 구현하지 않는다.
- 클래스 병합은 `cn()`을 써서 소비자 `className`이 기본값을 덮어쓰게 한다.
- 다크 모드는 `dark:` 변형을 함께 지정한다.
- **내보내는 컴포넌트는 타입을 명시한다**: `React.ForwardRefExoticComponent<XxxProps & React.RefAttributes<El>>`. primitives 타입을 추론에 맡기면 d.ts 빌드가 내부 청크 경로를 참조해 TS2742로 실패한다.
- 진입 애니메이션은 Tailwind v4 `starting:` 변형을 쓴다.
- 이 패키지는 CSS를 번들하지 않는다. 소비 앱이 Tailwind로 이 패키지 소스를 스캔해야 한다 (`apps/docs/src/index.css`의 `@source` 참고).

### Testing Requirements
- `pnpm --filter @logic-ui/ui test` (jsdom). `primitives`가 먼저 빌드되어야 하며 turbo의 `^build` 의존으로 자동 처리된다.

## Dependencies

### Internal
- `@logic-ui/primitives` (`workspace:*`)

### External
- `clsx`, `tailwind-merge`, `react`/`react-dom` (peer)

## Manual Notes

Notes under this heading are written by humans and preserved on regeneration.
