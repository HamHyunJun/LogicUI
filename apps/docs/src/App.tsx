import { Dialog as Headless } from '@logic-ui/primitives/dialog';
import { Accordion, Button, Dialog, Popover, Tabs } from '@logic-ui/ui';
import * as React from 'react';

export function App() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <header className="mb-12 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-500">@logic-ui/primitives</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">LogicUI</h1>
            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
              CSS 없이 동작, WAI-ARIA, 키보드 인터랙션만 제공하는 헤드리스 UI 라이브러리입니다.
            </p>
          </div>
          <ThemeToggle />
        </header>

        <Section title="Dialog" description="WAI-ARIA APG의 Modal Dialog 패턴을 따르는 합성 컴포넌트입니다.">
          <Playground />
        </Section>

        <Section title="스타일 없는 원본" description="primitives만 쓰고 클래스는 직접 지정한 예시입니다. 동작은 동일합니다.">
          <HeadlessExample />
        </Section>

        <Section title="중첩 다이얼로그" description="Esc와 바깥 클릭은 가장 위의 다이얼로그에만 적용됩니다.">
          <NestedExample />
        </Section>

        <Section title="키보드 인터랙션">
          <KeyboardTable />
        </Section>

        <Section title="Accordion" description="WAI-ARIA APG의 Accordion 패턴입니다. ↑/↓/Home/End로 헤더 사이를 이동합니다.">
          <AccordionExample />
        </Section>

        <Section title="Popover" description="트리거 옆에 뜨는 비모달 팝오버입니다. 공간이 부족하면 반대편으로 뒤집히고, Esc·바깥 클릭·포커스 이탈로 닫힙니다.">
          <PopoverExample />
        </Section>

        <Section title="Tabs" description="WAI-ARIA APG의 Tabs 패턴입니다. 방향키로 이동하며, manual 모드에서는 Enter/Space로 선택합니다.">
          <TabsExample />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {description && <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Playground() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [modal, setModal] = React.useState(true);
  const [blockEscape, setBlockEscape] = React.useState(false);
  const [blockOutside, setBlockOutside] = React.useState(false);
  const [log, setLog] = React.useState<string[]>([]);
  const push = (entry: string) => setLog((prev) => [entry, ...prev].slice(0, 6));

  return (
    <div className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <Toggle label="modal" checked={modal} onChange={setModal} />
        <Toggle label="Esc 닫기 막기" checked={blockEscape} onChange={setBlockEscape} />
        <Toggle label="바깥 클릭 닫기 막기" checked={blockOutside} onChange={setBlockOutside} />
      </div>

      <div className="flex items-center gap-3">
        <Dialog.Root
          open={isOpen}
          modal={modal}
          onOpenChange={(next) => {
            push(`onOpenChange(${next})`);
            setIsOpen(next);
          }}
        >
          <Dialog.Trigger asChild>
            <Button>프로필 편집</Button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay />
            <Dialog.Content
              onEscapeKeyDown={(event) => {
                push('onEscapeKeyDown');
                if (blockEscape) event.preventDefault();
              }}
              onPointerDownOutside={(event) => {
                push('onPointerDownOutside');
                if (blockOutside) event.preventDefault();
              }}
            >
              <Dialog.Header>
                <Dialog.Title>프로필 편집</Dialog.Title>
                <Dialog.Description>변경 사항은 저장 버튼을 눌러야 반영됩니다.</Dialog.Description>
              </Dialog.Header>
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">이름</span>
                <input
                  defaultValue="현준"
                  className="h-10 rounded-lg border border-zinc-300 bg-transparent px-3 dark:border-zinc-700"
                />
              </label>
              <Dialog.Footer>
                <Dialog.Close asChild>
                  <Button variant="secondary">취소</Button>
                </Dialog.Close>
                <Dialog.Close asChild>
                  <Button>저장</Button>
                </Dialog.Close>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
        <span className="text-sm text-zinc-500">
          상태: <code className="font-mono">{isOpen ? 'open' : 'closed'}</code>
        </span>
      </div>

      <ol className="min-h-24 rounded-lg bg-zinc-100 p-3 font-mono text-xs text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400">
        {log.length === 0 ? <li>이벤트 로그가 여기에 표시됩니다.</li> : log.map((entry, i) => <li key={i}>{entry}</li>)}
      </ol>
    </div>
  );
}

function HeadlessExample() {
  return (
    <Headless.Root>
      <Headless.Trigger className="rounded-md border border-dashed border-zinc-400 px-3 py-1.5 text-sm">
        열기
      </Headless.Trigger>
      <Headless.Portal>
        <Headless.Overlay className="fixed inset-0 bg-black/40" />
        <Headless.Content className="fixed top-1/2 left-1/2 w-80 -translate-x-1/2 -translate-y-1/2 border border-dashed border-zinc-400 bg-white p-4 text-zinc-900">
          <Headless.Title className="font-semibold">제목</Headless.Title>
          <Headless.Description className="mt-1 text-sm">내용</Headless.Description>
          <Headless.Close className="mt-4 rounded-md border border-dashed border-zinc-400 px-3 py-1.5 text-sm">
            닫기
          </Headless.Close>
        </Headless.Content>
      </Headless.Portal>
    </Headless.Root>
  );
}

function NestedExample() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button variant="secondary">설정 열기</Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>설정</Dialog.Title>
            <Dialog.Description>계정을 삭제하면 확인 다이얼로그가 한 번 더 열립니다.</Dialog.Description>
          </Dialog.Header>
          <Dialog.Footer>
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <Button variant="secondary">계정 삭제</Button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay />
                <Dialog.Content className="max-w-sm">
                  <Dialog.Header>
                    <Dialog.Title>정말 삭제할까요?</Dialog.Title>
                    <Dialog.Description>이 작업은 되돌릴 수 없습니다.</Dialog.Description>
                  </Dialog.Header>
                  <Dialog.Footer>
                    <Dialog.Close asChild>
                      <Button variant="secondary">취소</Button>
                    </Dialog.Close>
                    <Dialog.Close asChild>
                      <Button className="bg-red-600 text-white hover:bg-red-500 dark:bg-red-600 dark:text-white">삭제</Button>
                    </Dialog.Close>
                  </Dialog.Footer>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
            <Dialog.Close asChild>
              <Button>닫기</Button>
            </Dialog.Close>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function TabsExample() {
  const [manual, setManual] = React.useState(false);
  const [vertical, setVertical] = React.useState(false);
  return (
    <div className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <Toggle label="manual 활성화" checked={manual} onChange={setManual} />
        <Toggle label="vertical" checked={vertical} onChange={setVertical} />
      </div>
      <Tabs.Root
        defaultValue="profile"
        activationMode={manual ? 'manual' : 'automatic'}
        orientation={vertical ? 'vertical' : 'horizontal'}
        className="flex gap-3 data-[orientation=horizontal]:flex-col"
      >
        <Tabs.List aria-label="계정 설정">
          <Tabs.Trigger value="profile">프로필</Tabs.Trigger>
          <Tabs.Trigger value="billing" disabled>
            결제
          </Tabs.Trigger>
          <Tabs.Trigger value="security">보안</Tabs.Trigger>
        </Tabs.List>
        <div className="flex-1">
          <Tabs.Content value="profile" className="mt-0">프로필 정보를 수정합니다.</Tabs.Content>
          <Tabs.Content value="security" className="mt-0">비밀번호와 2단계 인증을 관리합니다.</Tabs.Content>
        </div>
      </Tabs.Root>
    </div>
  );
}

function AccordionExample() {
  const [multiple, setMultiple] = React.useState(false);
  const [collapsible, setCollapsible] = React.useState(true);
  return (
    <div className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <Toggle label="multiple" checked={multiple} onChange={setMultiple} />
        <Toggle label="collapsible (single)" checked={collapsible} onChange={setCollapsible} />
      </div>
      {/* type을 바꾸면 열린 상태가 의미를 잃으므로 key로 초기화한다. */}
      <Accordion.Root key={String(multiple)} type={multiple ? 'multiple' : 'single'} collapsible={collapsible} defaultValue={['what']}>
        <Accordion.Item value="what">
          <Accordion.Header>
            <Accordion.Trigger>헤드리스 UI란?</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>스타일 없이 동작·접근성·키보드 인터랙션만 제공하는 컴포넌트입니다.</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="a11y">
          <Accordion.Header>
            <Accordion.Trigger>접근성은 어떻게 보장하나요?</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>WAI-ARIA APG 패턴의 키보드 표를 테스트로 옮겨 검증합니다.</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="disabled" disabled>
          <Accordion.Header>
            <Accordion.Trigger>비활성 항목</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>열리지 않습니다.</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </div>
  );
}

function PopoverExample() {
  const [side, setSide] = React.useState<'top' | 'right' | 'bottom' | 'left'>('bottom');
  return (
    <div className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <fieldset className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <legend className="sr-only">팝오버 방향</legend>
        {(['top', 'right', 'bottom', 'left'] as const).map((s) => (
          <label key={s} className="inline-flex items-center gap-1.5">
            <input type="radio" name="popover-side" checked={side === s} onChange={() => setSide(s)} />
            <span>{s}</span>
          </label>
        ))}
      </fieldset>
      <div className="flex justify-center py-10">
        <Popover.Root>
          <Popover.Trigger asChild>
            <Button variant="secondary">크기 설정</Button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content side={side} aria-label="크기 설정">
              <label className="grid gap-1.5">
                <span className="font-medium">너비</span>
                <input defaultValue="100%" className="h-9 rounded-lg border border-zinc-300 bg-transparent px-3 dark:border-zinc-700" />
              </label>
              <Popover.Close asChild>
                <Button variant="ghost" className="mt-3 h-8 px-3">
                  닫기
                </Button>
              </Popover.Close>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </div>
  );
}

const KEYS: Array<[string, string]> = [
  ['Enter / Space', '트리거에서 다이얼로그를 연다.'],
  ['Tab', '다이얼로그 안의 다음 요소로 이동한다. 마지막 요소에서는 첫 요소로 돌아간다.'],
  ['Shift + Tab', '이전 요소로 이동한다. 첫 요소에서는 마지막 요소로 돌아간다.'],
  ['Esc', '다이얼로그를 닫고 트리거로 포커스를 되돌린다.'],
];

function KeyboardTable() {
  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-100 dark:bg-zinc-900">
          <tr>
            <th className="px-4 py-2 font-medium">키</th>
            <th className="px-4 py-2 font-medium">동작</th>
          </tr>
        </thead>
        <tbody>
          {KEYS.map(([key, action]) => (
            <tr key={key} className="border-t border-zinc-200 dark:border-zinc-800">
              <td className="px-4 py-2 whitespace-nowrap">
                <kbd className="rounded border border-zinc-300 px-1.5 py-0.5 font-mono text-xs dark:border-zinc-700">{key}</kbd>
              </td>
              <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">{action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4" />
      <span>{label}</span>
    </label>
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
