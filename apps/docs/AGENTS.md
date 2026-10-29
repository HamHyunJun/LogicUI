# docs

**Parent context:** `../../AGENTS.md`
**Generated:** 2026-10-29 · **Updated:** 2026-10-29

## Purpose
`@logic-ui-kit/docs`. Vite + React 데모/플레이그라운드 (private, npm 배포 대상 아님). Vercel에 정적 배포되어 https://logicui.vercel.app 으로 공개된다.

## Key Files
| File | Description |
|------|-------------|
| `src/App.tsx` | 데모 페이지 전체. 섹션: Dialog(Playground·스타일 없는 원본·중첩), 키보드 인터랙션 표, Accordion(multiple·collapsible 토글), Tooltip(4방향), Popover(방향 선택), Menu(액션·체크박스·라디오), Tabs(manual·vertical 토글), 라이트/다크 토글 |
| `src/index.css` | Tailwind import, `@source '../../../packages/ui/src'`, `dark` 커스텀 변형(클래스 기반) |
| `src/main.tsx` | React 진입점 |
| `index.html` | `lang="ko"`, 타이틀 `LogicUI 문서` |
| `vite.config.ts` | `@vitejs/plugin-react` + `@tailwindcss/vite` |
| `package.json` | `build`는 `tsc --noEmit && vite build`, `e2e`는 `playwright test` |
| `playwright.config.ts`, `e2e/*.spec.ts` | 브라우저 E2E: Dialog(포커스 트랩·Esc·중첩), Tabs/Accordion 키보드, Tooltip/Popover 배치·닫기, Menu 키보드·선택·배치 |

## For AI Agents

### Working In This Directory
- 새 컴포넌트를 추가하면 여기에 예제 섹션을 함께 추가한다 (`CLAUDE.md` 체크리스트 6번).
- `@logic-ui-kit/ui`의 클래스를 Tailwind가 스캔하도록 `index.css`의 `@source`를 유지한다.
- 워크스페이스 패키지는 빌드 산출물(`dist`)을 쓰므로 단독 실행 전에 `primitives`/`ui` 빌드가 필요하다. 루트 `pnpm dev`가 이를 처리한다.
- `main`에 머지되면 Vercel production이 재배포된다. 빌드는 루트 `vercel.json` 기준이며 이 디렉터리를 Root Directory로 지정하지 않는다.
- changeset 대상이 아니다 (`.changeset/config.json`의 `ignore`).

### Testing Requirements
- `pnpm --filter @logic-ui-kit/docs typecheck`와 `pnpm build`로 검증한다.
- `e2e/`에 Playwright(Chromium) 테스트가 있다. 루트에서 `pnpm e2e`를 실행하면 docs를 빌드하고 `vite preview`(4173)로 띄워 검사한다. 처음 한 번 `pnpm --filter @logic-ui-kit/docs exec playwright install chromium`이 필요하다.
- jsdom이 못 잡는 포커스 트랩·Esc·위치(겹침, 뒤집기)를 다룬다. 새 컴포넌트 예제를 추가하면 시나리오도 추가한다.

## Dependencies

### Internal
- `@logic-ui-kit/primitives`, `@logic-ui-kit/ui` (`workspace:*`)

### External
- `react`, `react-dom`, `vite`, `tailwindcss` v4, `@tailwindcss/vite`

## Manual Notes

Notes under this heading are written by humans and preserved on regeneration.
