# LogicUI

**Generated:** 2026-10-29 · **Updated:** 2026-10-29

## Purpose
스타일(CSS) 없이 동작·WAI-ARIA 접근성·키보드 인터랙션만 제공하는 헤드리스 React UI 라이브러리 모노레포. pnpm 워크스페이스 + Turborepo, Changesets로 npm 배포. 현재 구현된 컴포넌트는 Dialog, Tabs, Accordion, Popover, Tooltip이다.

작업 규칙(언어, 컴포넌트 API 형태, 테스트 규칙, Git 규칙)의 원문은 루트 `CLAUDE.md`다. 이 문서는 구조 안내이며 규칙을 복제하지 않는다.

## Key Files
| File | Description |
|------|-------------|
| `CLAUDE.md` | 모든 작업에 적용되는 규칙 (먼저 읽을 것) |
| `README.md` | 소개, 데모 링크(https://logicui.vercel.app), 컴포넌트 표, Dialog 사용법 |
| `package.json` | 루트 스크립트(`build`/`dev`/`test`/`typecheck`는 turbo, `changeset`, `release`) |
| `turbo.json` | 태스크 그래프. `test`/`typecheck`/`dev`는 `^build`에 의존 |
| `pnpm-workspace.yaml` | `packages/*`, `apps/*` |
| `tsconfig.base.json` | `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax` |
| `vercel.json` | 데모 배포: `turbo --filter=@logic-ui-kit/docs` 빌드 → `apps/docs/dist` |
| `.changeset/` | 변경 기록. `@logic-ui-kit/docs`는 ignore |
| `.github/workflows/` | `ci.yml`(Node 22/24: typecheck·test·build), `release.yml`(Changesets 릴리스) |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `packages/primitives/` | `@logic-ui-kit/primitives` 헤드리스 로직 코어 (see `packages/primitives/AGENTS.md`) |
| `packages/ui/` | `@logic-ui-kit/ui` Tailwind 레퍼런스 디자인 시스템 (see `packages/ui/AGENTS.md`) |
| `apps/docs/` | Vite 데모/플레이그라운드 (see `apps/docs/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- 의존 방향은 `docs → ui → primitives` 한 방향. primitives는 다른 워크스페이스 패키지를 import하지 않는다.
- main에 직접 커밋하지 않는다. `feat/…`, `fix/…`, `docs/…` 브랜치 → PR → squash 머지.
- 공개 API·동작을 바꾸면 `pnpm changeset`으로 변경 기록을 포함한다.
- `main`에 머지되면 Vercel production(`logicui.vercel.app`)이 자동 재배포된다.

### Testing Requirements
```bash
pnpm install        # Node 22.22+, pnpm 10 (corepack enable)
pnpm typecheck && pnpm test && pnpm build   # 작업 완료 전 모두 통과해야 함
pnpm --filter @logic-ui-kit/primitives test     # 패키지 하나만
```

### Common Patterns
- 합성 컴포넌트(`Root` + 하위 파트), `asChild`, `forwardRef`, 제어/비제어 상태. 자세한 내용은 `CLAUDE.md`.

## Dependencies

### External
- React ≥18 (peer), TypeScript 5.9, Turborepo, tsup, Vitest, Changesets, Vite, Tailwind CSS v4

## Manual Notes

Notes under this heading are written by humans and preserved on regeneration.
