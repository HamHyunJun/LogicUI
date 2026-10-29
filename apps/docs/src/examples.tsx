import { Dialog as Headless } from '@logic-ui-kit/primitives/dialog';
import { Accordion, Breadcrumb, Button, Checkbox, Dialog, Menu, Popover, Progress, RadioGroup, Switch, Tabs, ToggleGroup, Tooltip } from '@logic-ui-kit/ui';
import * as React from 'react';
import { Toggle } from './doc-ui';

export function Playground() {
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

export function HeadlessExample() {
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

export function NestedExample() {
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

export function TabsExample() {
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

export function AccordionExample() {
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

export function TooltipExample() {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
        <Tooltip.Root key={side}>
          <Tooltip.Trigger asChild>
            <Button variant="secondary">{side}</Button>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content side={side}>툴팁이 {side} 방향에 표시됩니다</Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      ))}
    </div>
  );
}

export function PopoverExample() {
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

export function MenuExample() {
  const [ruler, setRuler] = React.useState(true);
  const [sort, setSort] = React.useState('name');
  const [last, setLast] = React.useState('');
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <Menu.Root>
        <Menu.Trigger asChild>
          <Button variant="secondary">파일</Button>
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Content>
            <Menu.Item onSelect={() => setLast('새 파일')}>새 파일</Menu.Item>
            <Menu.Item onSelect={() => setLast('열기')}>열기</Menu.Item>
            <Menu.Item disabled>인쇄</Menu.Item>
            <Menu.Separator />
            <Menu.Item onSelect={() => setLast('저장')}>저장</Menu.Item>
            <Menu.Item onSelect={() => setLast('다른 이름으로 저장')}>다른 이름으로 저장</Menu.Item>
          </Menu.Content>
        </Menu.Portal>
      </Menu.Root>

      <Menu.Root>
        <Menu.Trigger asChild>
          <Button variant="secondary">보기</Button>
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Content>
            <Menu.CheckboxItem checked={ruler} onCheckedChange={setRuler} onSelect={(event) => event.preventDefault()}>
              눈금자
            </Menu.CheckboxItem>
            <Menu.Separator />
            <Menu.RadioGroup aria-label="정렬 기준" value={sort} onValueChange={setSort}>
              <Menu.RadioItem value="name" onSelect={(event) => event.preventDefault()}>
                이름순
              </Menu.RadioItem>
              <Menu.RadioItem value="date" onSelect={(event) => event.preventDefault()}>
                날짜순
              </Menu.RadioItem>
            </Menu.RadioGroup>
          </Menu.Content>
        </Menu.Portal>
      </Menu.Root>

      <p className="text-sm text-zinc-600 dark:text-zinc-400" aria-live="polite">
        마지막 선택: {last || '없음'} · 눈금자 {ruler ? '켜짐' : '꺼짐'} · 정렬 {sort === 'name' ? '이름순' : '날짜순'}
      </p>
    </div>
  );
}

export function SwitchExample() {
  const [airplane, setAirplane] = React.useState(false);
  return (
    <div className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-3">
        <Switch.Root id="airplane" checked={airplane} onCheckedChange={setAirplane}>
          <Switch.Thumb />
        </Switch.Root>
        <label htmlFor="airplane" className="text-sm font-medium">
          비행기 모드
        </label>
        <span className="text-sm text-zinc-500">
          상태: <code className="font-mono">{airplane ? 'on' : 'off'}</code>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Switch.Root id="beta" disabled>
          <Switch.Thumb />
        </Switch.Root>
        <label htmlFor="beta" className="text-sm font-medium text-zinc-500">
          베타 기능 (비활성)
        </label>
      </div>
    </div>
  );
}

export function CheckboxExample() {
  const [items, setItems] = React.useState([true, false, false]);
  const labels = ['이메일 알림', '푸시 알림', 'SMS 알림'];
  const all = items.every(Boolean) ? true : items.some(Boolean) ? 'indeterminate' : false;
  return (
    <div className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-3">
        <Checkbox.Root id="all" checked={all} onCheckedChange={(checked) => setItems(items.map(() => checked === true))} />
        <label htmlFor="all" className="text-sm font-semibold">
          모두 선택
        </label>
      </div>
      <div className="ml-8 grid gap-3">
        {labels.map((label, i) => (
          <div key={label} className="flex items-center gap-3">
            <Checkbox.Root
              id={`item-${i}`}
              checked={items[i] ?? false}
              onCheckedChange={(checked) => setItems(items.map((v, j) => (j === i ? checked === true : v)))}
            />
            <label htmlFor={`item-${i}`} className="text-sm">
              {label}
            </label>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Checkbox.Root id="locked" disabled defaultChecked />
        <label htmlFor="locked" className="text-sm text-zinc-500">
          필수 약관 (비활성)
        </label>
      </div>
    </div>
  );
}

export function RadioGroupExample() {
  const [plan, setPlan] = React.useState('pro');
  const plans = [
    ['free', '무료', '개인 프로젝트에 적합합니다.'],
    ['pro', '프로', '팀 협업 기능이 포함됩니다.'],
    ['team', '팀', '조직 단위 관리가 가능합니다.'],
  ] as const;
  return (
    <div className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <RadioGroup.Root aria-label="요금제" value={plan} onValueChange={setPlan}>
        {plans.map(([value, label, description]) => (
          <div key={value} className="flex items-start gap-3">
            <RadioGroup.Item id={`plan-${value}`} value={value} disabled={value === 'team'} />
            <label htmlFor={`plan-${value}`} className="grid text-sm">
              <span className="font-medium">{label}{value === 'team' && ' (비활성)'}</span>
              <span className="text-zinc-500">{description}</span>
            </label>
          </div>
        ))}
      </RadioGroup.Root>
      <p className="text-sm text-zinc-500">
        선택: <code className="font-mono">{plan}</code>
      </p>
    </div>
  );
}

export function ProgressExample() {
  const [value, setValue] = React.useState(35);
  return (
    <div className="grid gap-5 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="grid gap-2">
        <div className="flex justify-between text-sm">
          <span id="upload-label" className="font-medium">
            업로드
          </span>
          <span className="font-mono text-zinc-500">{value}%</span>
        </div>
        <Progress.Root aria-labelledby="upload-label" value={value}>
          <Progress.Indicator />
        </Progress.Root>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setValue((v) => Math.max(0, v - 15))}>
            -15
          </Button>
          <Button variant="secondary" onClick={() => setValue((v) => Math.min(100, v + 15))}>
            +15
          </Button>
        </div>
      </div>
      <div className="grid gap-2">
        <span id="load-label" className="text-sm font-medium">
          불러오는 중 (진행 정도를 알 수 없음)
        </span>
        <Progress.Root aria-labelledby="load-label" value={null}>
          <Progress.Indicator />
        </Progress.Root>
      </div>
    </div>
  );
}

export function ToggleGroupExample() {
  const [align, setAlign] = React.useState<string[]>(['left']);
  const [format, setFormat] = React.useState<string[]>(['bold']);
  return (
    <div className="grid gap-5 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="grid gap-2">
        <span className="text-sm font-medium">정렬 (single)</span>
        <ToggleGroup.Root aria-label="정렬" type="single" value={align} onValueChange={setAlign}>
          <ToggleGroup.Item value="left">왼쪽</ToggleGroup.Item>
          <ToggleGroup.Item value="center">가운데</ToggleGroup.Item>
          <ToggleGroup.Item value="right">오른쪽</ToggleGroup.Item>
        </ToggleGroup.Root>
      </div>
      <div className="grid gap-2">
        <span className="text-sm font-medium">서식 (multiple)</span>
        <ToggleGroup.Root aria-label="서식" type="multiple" value={format} onValueChange={setFormat}>
          <ToggleGroup.Item value="bold">굵게</ToggleGroup.Item>
          <ToggleGroup.Item value="italic">기울임</ToggleGroup.Item>
          <ToggleGroup.Item value="underline" disabled>
            밑줄
          </ToggleGroup.Item>
        </ToggleGroup.Root>
      </div>
      <p className="text-sm text-zinc-500">
        정렬 <code className="font-mono">{align.join(',') || '없음'}</code> · 서식 <code className="font-mono">{format.join(',') || '없음'}</code>
      </p>
    </div>
  );
}

export function BreadcrumbExample() {
  return (
    <div className="grid gap-5 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <Breadcrumb.Root aria-label="현재 위치">
        <Breadcrumb.List>
          <Breadcrumb.Item>
            <Breadcrumb.Link href="#/">소개</Breadcrumb.Link>
          </Breadcrumb.Item>
          <Breadcrumb.Separator />
          <Breadcrumb.Item>
            <Breadcrumb.Link href="#/menu">Menu</Breadcrumb.Link>
          </Breadcrumb.Item>
          <Breadcrumb.Separator />
          <Breadcrumb.Item>
            <Breadcrumb.Page>Breadcrumb</Breadcrumb.Page>
          </Breadcrumb.Item>
        </Breadcrumb.List>
      </Breadcrumb.Root>
      <Breadcrumb.Root aria-label="다른 구분자">
        <Breadcrumb.List>
          <Breadcrumb.Item>
            <Breadcrumb.Link href="#/">소개</Breadcrumb.Link>
          </Breadcrumb.Item>
          <Breadcrumb.Separator>›</Breadcrumb.Separator>
          <Breadcrumb.Item>
            <Breadcrumb.Page>구분자를 바꾼 예</Breadcrumb.Page>
          </Breadcrumb.Item>
        </Breadcrumb.List>
      </Breadcrumb.Root>
    </div>
  );
}
