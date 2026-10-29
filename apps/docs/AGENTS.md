# docs

**Parent context:** `../../AGENTS.md`
**Generated:** 2026-10-29 · **Updated:** 2026-10-29

## Purpose
`@logic-ui-kit/docs`. Vite + React 데모/플레이그라운드 (private, npm 배포 대상 아님). Vercel에 정적 배포되어 https://logicui.vercel.app 으로 공개된다.

## Key Files
| File | Description |
|------|-------------|
| `src/App.tsx` | 레이아웃(헤더·내비게이션·본문)과 해시 라우터(`#/dialog`), 소개 페이지, 컴포넌트 페이지 템플릿(예제·사용법·API·키보드). 라우트가 바뀌면 `document.title`을 갱신하고 h1로 포커스를 옮김(첫 로드는 제외), 본문 건너뛰기 버튼 |
| `src/pages.tsx` | 컴포넌트별 페이지 데이터: 요약, APG 링크, 예제, 사용 코드, 파트별 Props 표, 키보드 표. **컴포넌트 API를 바꾸면 여기도 고친다** |
| `src/examples.tsx` | 라이브 예제 컴포넌트(Playground, Tabs, Accordion, Tooltip, Popover, Menu 등) |
| `src/doc-ui.tsx` | 문서 공용 UI: `Section`, `Toggle`, `CodeBlock`, `ApiTable`, `KeyTable` |
| `src/index.css` | Tailwind import, `@source '../../../packages/ui/src'`, `dark` 커스텀 변형(클래스 기반) |
| `src/main.tsx` | React 진입점 |
| `index.html` | `lang="ko"`, 타이틀 `LogicUI 문서` |
| `vite.config.ts` | `@vitejs/plugin-react` + `@tailwindcss/vite` |
| `package.json` | `build`는 `tsc --noEmit && vite build`, `e2e`는 `playwright test` |
| `playwright.config.ts`, `e2e/*.spec.ts` | 브라우저 E2E: Dialog(포커스 트랩·Esc·중첩), Tabs/Accordion 키보드, Tooltip/Popover 배치·닫기, Menu 키보드·선택·배치, 페이지 이동 |

## For AI Agents

### Working In This Directory
- 새 컴포넌트를 추가하면 `examples.tsx`에 예제를, `pages.tsx`에 페이지 데이터(Props·키보드 표 포함)를 추가한다 (`CLAUDE.md` 체크리스트 6번). 내비게이션과 소개 페이지의 목록은 `PAGES`에서 자동으로 만들어진다.
- 라우팅은 라이브러리 없이 `location.hash`를 쓴다(정적 호스팅에서 리라이트 설정이 필요 없다). 대신 페이지마다 별도 URL의 서버 렌더링은 되지 않는다.
- `@logic-ui-kit/ui`의 클래스를 Tailwind가 스캔하도록 `index.css`의 `@source`를 유지한다.
- 워크스페이스 패키지는 빌드 산출물(`dist`)을 쓰므로 단독 실행 전에 `primitives`/`ui` 빌드가 필요하다. 루트 `pnpm dev`가 이를 처리한다.
- `main`에 머지되면 Vercel production이 재배포된다. 빌드는 루트 `vercel.json` 기준이며 이 디렉터리를 Root Directory로 지정하지 않는다.
- changeset 대상이 아니다 (`.changeset/config.json`의 `ignore`).

### Testing Requirements
- `pnpm --filter @logic-ui-kit/docs typecheck`와 `pnpm build`로 검증한다.
- `e2e/`에 Playwright(Chromium) 테스트가 있다. 루트에서 `pnpm e2e`를 실행하면 docs를 빌드하고 `vite preview`(4173)로 띄워 검사한다. 처음 한 번 `pnpm --filter @logic-ui-kit/docs exec playwright install chromium`이 필요하다.
- jsdom이 못 잡는 포커스 트랩·Esc·위치(겹침, 뒤집기)와 페이지 이동(`navigation.spec.ts`)을 다룬다. 애니메이션이 끝난 뒤 박스를 재려면 `transform`이 아니라 `scale` 속성을 기다린다(Tailwind v4). 새 컴포넌트 예제를 추가하면 시나리오도 추가한다.

## Dependencies

### Internal
- `@logic-ui-kit/primitives`, `@logic-ui-kit/ui` (`workspace:*`)

### External
- `react`, `react-dom`, `vite`, `tailwindcss` v4, `@tailwindcss/vite`

## Manual Notes

Notes under this heading are written by humans and preserved on regeneration.
