import { Button } from '@logic-ui-kit/ui';
import * as React from 'react';
import { ApiTable, CodeBlock, KeyTable, Section } from './doc-ui';
import { PAGES, type DocPage } from './pages';

const SITE = 'LogicUI';

// 정적 호스팅에서 서버 리라이트 없이 동작하도록 해시(#/dialog)로 라우팅한다.
const readSlug = (): string => window.location.hash.replace(/^#\/?/, '');

function useSlug(): string {
  const [slug, setSlug] = React.useState(readSlug);
  React.useEffect(() => {
    const onHashChange = (): void => setSlug(readSlug());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  return slug;
}

export function App() {
  const slug = useSlug();
  const page = PAGES.find((p) => p.slug === slug);
  const mainRef = React.useRef<HTMLElement | null>(null);
  const headingRef = React.useRef<HTMLHeadingElement | null>(null);
  const isFirstRender = React.useRef(true);

  const title = page ? `${page.title} · ${SITE}` : `${SITE} 문서`;
  React.useEffect(() => {
    document.title = title;
    // 첫 로드는 건드리지 않고, 이후 페이지 이동에서만 제목으로 포커스를 옮겨 스크린리더에 알린다.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
    headingRef.current?.focus({ preventScroll: true });
  }, [title]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <button
        type="button"
        onClick={() => mainRef.current?.focus()}
        className="sr-only z-50 rounded-lg bg-white px-3 py-2 text-sm focus:not-sr-only focus:fixed focus:top-2 focus:left-2 dark:bg-zinc-900"
      >
        본문으로 건너뛰기
      </button>

      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <a href="#/" className="text-lg font-bold tracking-tight">
            {SITE}
          </a>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 md:grid md:grid-cols-[12rem_minmax(0,1fr)] md:gap-10">
        <nav aria-label="컴포넌트" className="mb-8 md:sticky md:top-8 md:mb-0 md:self-start">
          <ul className="flex flex-wrap gap-1 md:flex-col">
            <NavLink href="#/" current={!page}>
              소개
            </NavLink>
            {PAGES.map((p) => (
              <NavLink key={p.slug} href={`#/${p.slug}`} current={p.slug === slug}>
                {p.title}
              </NavLink>
            ))}
          </ul>
        </nav>

        <main id="main" ref={mainRef} tabIndex={-1} className="min-w-0 outline-none">
          {page ? <ComponentPage page={page} headingRef={headingRef} /> : <Overview headingRef={headingRef} />}
        </main>
      </div>
    </div>
  );
}

function NavLink({ href, current, children }: { href: string; current: boolean; children: React.ReactNode }) {
  return (
    <li>
      <a
        href={href}
        aria-current={current ? 'page' : undefined}
        className="block rounded-lg px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 aria-[current=page]:bg-zinc-200 aria-[current=page]:font-semibold aria-[current=page]:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50 dark:aria-[current=page]:bg-zinc-800 dark:aria-[current=page]:text-zinc-50"
      >
        {children}
      </a>
    </li>
  );
}

type HeadingRef = React.RefObject<HTMLHeadingElement | null>;

function Overview({ headingRef }: { headingRef: HeadingRef }) {
  return (
    <>
      <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold tracking-tight outline-none">
        LogicUI
      </h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">
        CSS 없이 동작, WAI-ARIA 접근성, 키보드 인터랙션만 제공하는 헤드리스 React UI 라이브러리입니다.
      </p>

      <div className="mt-8">
        <Section title="설치">
          <CodeBlock
            label="설치 명령"
            code={`pnpm add @logic-ui-kit/primitives   # 스타일 없는 헤드리스 컴포넌트
pnpm add @logic-ui-kit/ui           # Tailwind 스타일 버전 (primitives 포함)`}
          />
        </Section>

        <Section title="특징">
          <ul className="grid gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <li>
              <strong>CSS 0%, 런타임 의존성 0.</strong> <code className="font-mono">react</code>와 <code className="font-mono">react-dom</code>만 peer로
              둡니다. 스타일링은 <code className="font-mono">data-state</code> 같은 data 속성으로 합니다.
            </li>
            <li>
              <strong>WAI-ARIA APG 패턴.</strong> 각 패턴의 역할·속성·키보드 표를 테스트로 옮겨 검증합니다.
            </li>
            <li>
              <strong>합성 컴포넌트.</strong> Root + 하위 파트, 제어·비제어 상태, <code className="font-mono">asChild</code>, 취소 가능한 콜백.
            </li>
            <li>
              <strong>스타일 버전 제공.</strong> <code className="font-mono">@logic-ui-kit/ui</code>는 같은 동작에 Tailwind v4 클래스만 입힌 레퍼런스입니다.
            </li>
          </ul>
        </Section>

        <Section title="컴포넌트">
          <ul className="grid gap-3 sm:grid-cols-2">
            {PAGES.map((p) => (
              <li key={p.slug}>
                <a
                  href={`#/${p.slug}`}
                  className="block h-full rounded-2xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
                >
                  <span className="font-semibold">{p.title}</span>
                  <span className="mt-1 block text-sm text-zinc-600 dark:text-zinc-400">{p.summary}</span>
                </a>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="링크">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <li>
              <ExternalLink href="https://github.com/HamHyunJun/LogicUI">GitHub</ExternalLink>
            </li>
            <li>
              <ExternalLink href="https://www.npmjs.com/package/@logic-ui-kit/primitives">npm · primitives</ExternalLink>
            </li>
            <li>
              <ExternalLink href="https://www.npmjs.com/package/@logic-ui-kit/ui">npm · ui</ExternalLink>
            </li>
          </ul>
        </Section>
      </div>
    </>
  );
}

function ComponentPage({ page, headingRef }: { page: DocPage; headingRef: HeadingRef }) {
  return (
    <>
      <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold tracking-tight outline-none">
        {page.title}
      </h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">{page.summary}</p>
      {page.apg && (
        <p className="mt-2 text-sm">
          <ExternalLink href={page.apg.href}>WAI-ARIA APG · {page.apg.label} 패턴</ExternalLink>
        </p>
      )}

      <div className="mt-8">
        <Section title="예제">
          <div className="grid gap-8">
            {page.examples.map((example) => (
              <div key={example.title}>
                {page.examples.length > 1 && <h3 className="text-base font-semibold">{example.title}</h3>}
                {example.description && <p className="mt-1 mb-3 text-sm text-zinc-600 dark:text-zinc-400">{example.description}</p>}
                {example.node}
              </div>
            ))}
          </div>
        </Section>

        <Section title="사용법" description="스타일이 입혀진 버전은 @logic-ui-kit/ui에서 같은 이름으로 가져옵니다.">
          <CodeBlock label={`${page.title} 사용 예`} code={page.code} />
        </Section>

        <Section
          title="API"
          description="DOM을 렌더하는 모든 파트는 asChild, ref, 네이티브 props를 지원하고 상태는 data-state 같은 data 속성으로 노출합니다."
        >
          <ApiTable parts={page.parts} />
        </Section>

        <Section title="키보드">
          <KeyTable keys={page.keys} />
        </Section>
      </div>
    </>
  );
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-zinc-600 dark:hover:text-zinc-300">
      {children}
      <span className="sr-only"> (새 창)</span>
    </a>
  );
}

function ThemeToggle() {
  const [dark, setDark] = React.useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);
  return (
    <Button variant="ghost" onClick={() => setDark((d) => !d)} aria-pressed={dark}>
      {dark ? '라이트 모드' : '다크 모드'}
    </Button>
  );
}
