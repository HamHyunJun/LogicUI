import * as React from 'react';
import type { PartDoc, PropDoc } from './doc-ui';
import {
  AccordionExample,
  HeadlessExample,
  MenuExample,
  NestedExample,
  PopoverExample,
  Playground,
  TabsExample,
  TooltipExample,
  SwitchExample,
  CheckboxExample,
  RadioGroupExample,
  ProgressExample,
  ToggleGroupExample,
  BreadcrumbExample,
} from './examples';

export interface DocPage {
  slug: string;
  title: string;
  summary: string;
  apg?: { label: string; href: string };
  examples: Array<{ title: string; description?: string; node: React.ReactNode }>;
  code: string;
  parts: PartDoc[];
  keys: Array<[string, string]>;
}

const APG = 'https://www.w3.org/WAI/ARIA/apg/patterns';

// 여러 컴포넌트가 공통으로 쓰는 Props.
const open: PropDoc[] = [
  { name: 'open', type: 'boolean', description: '제어 모드의 열림 상태.' },
  { name: 'defaultOpen', type: 'boolean', description: '비제어 모드의 초기 열림 상태.', default: 'false' },
  { name: 'onOpenChange', type: '(open: boolean) => void', description: '열림 상태가 바뀌어야 할 때 호출된다.' },
];

const portal: PartDoc = {
  name: 'Portal',
  description: '내용을 document.body(또는 container)로 옮긴다. 닫혀 있으면 렌더하지 않는다.',
  props: [
    { name: 'container', type: 'Element | DocumentFragment | null', description: '포털을 붙일 대상.', default: 'document.body' },
    { name: 'forceMount', type: 'boolean', description: '닫혀 있어도 자식을 렌더한다.' },
  ],
};

const placement: PropDoc[] = [
  { name: 'forceMount', type: 'boolean', description: '닫혀 있어도 렌더한다.' },
  { name: 'side', type: "'top' | 'right' | 'bottom' | 'left'", description: '트리거 기준 배치 방향. 공간이 부족하면 반대편으로 뒤집힌다.' },
  { name: 'align', type: "'start' | 'center' | 'end'", description: '배치 방향 축에 대한 정렬.' },
  { name: 'sideOffset', type: 'number', description: '트리거와의 간격(px).', default: '4' },
];

const escapeProp: PropDoc = {
  name: 'onEscapeKeyDown',
  type: '(event: KeyboardEvent) => void',
  description: 'Esc 키를 눌렀을 때 호출. preventDefault()로 닫힘을 막을 수 있다.',
};
const pointerOutsideProp: PropDoc = {
  name: 'onPointerDownOutside',
  type: '(event: CustomEvent) => void',
  description: 'Content 바깥에서 포인터를 눌렀을 때 호출. preventDefault()로 닫힘을 막을 수 있다.',
};
const openAutoFocus: PropDoc = {
  name: 'onOpenAutoFocus',
  type: '(event: Event) => void',
  description: '열릴 때 자동 포커스 직전에 호출. preventDefault()로 기본 포커스 이동을 막을 수 있다.',
};
const closeAutoFocus: PropDoc = {
  name: 'onCloseAutoFocus',
  type: '(event: Event) => void',
  description: '닫힐 때 트리거로 포커스를 되돌리기 직전에 호출. preventDefault()로 막을 수 있다.',
};

export const PAGES: DocPage[] = [
  {
    slug: 'dialog',
    title: 'Dialog',
    summary: '포커스 트랩, 바깥 요소 inert 처리, 스크롤 잠금을 갖춘 모달 다이얼로그입니다. 중첩하면 Esc와 바깥 클릭은 가장 위 레이어에만 적용됩니다.',
    apg: { label: 'Modal Dialog', href: `${APG}/dialog-modal/` },
    examples: [
      { title: 'Playground', description: '옵션을 바꿔 가며 이벤트 로그로 콜백이 호출되는 순서를 확인해 보세요.', node: <Playground /> },
      { title: '스타일 없는 원본', description: 'primitives만 쓰고 클래스는 직접 지정한 예시입니다. 동작은 동일합니다.', node: <HeadlessExample /> },
      { title: '중첩 다이얼로그', description: 'Esc와 바깥 클릭은 가장 위의 다이얼로그에만 적용됩니다.', node: <NestedExample /> },
    ],
    code: `import { Dialog } from '@logic-ui-kit/primitives/dialog';

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
</Dialog.Root>`,
    parts: [
      {
        name: 'Dialog.Root',
        description: '상태를 제공한다. 제어(open)와 비제어(defaultOpen)를 모두 지원한다.',
        props: [
          ...open,
          { name: 'modal', type: 'boolean', description: 'false면 바깥과 상호작용 가능한 비모달 다이얼로그가 된다. 모달은 포커스 트랩, inert, 스크롤 잠금, aria-modal을 적용한다.', default: 'true' },
        ],
      },
      { name: 'Dialog.Trigger', description: 'aria-haspopup, aria-expanded, aria-controls를 자동으로 연결한다.' },
      { ...portal, name: 'Dialog.Portal' },
      { name: 'Dialog.Overlay', description: '모달일 때만 렌더되는 배경. data-state로 스타일링한다.', props: [{ name: 'forceMount', type: 'boolean', description: '닫혀 있어도 렌더한다.' }] },
      {
        name: 'Dialog.Content',
        description: 'role="dialog". Title·Description이 렌더되면 aria-labelledby·aria-describedby를 자동 연결한다.',
        props: [{ name: 'forceMount', type: 'boolean', description: '닫혀 있어도 렌더한다.' }, openAutoFocus, closeAutoFocus, escapeProp, pointerOutsideProp],
      },
      { name: 'Dialog.Title', description: 'Content의 접근 가능한 이름.' },
      { name: 'Dialog.Description', description: 'Content의 접근 가능한 설명.' },
      { name: 'Dialog.Close', description: '누르면 닫는다.' },
    ],
    keys: [
      ['Enter / Space', '트리거에서 다이얼로그를 연다.'],
      ['Tab', '다이얼로그 안의 다음 요소로 이동한다. 마지막 요소에서는 첫 요소로 돌아간다.'],
      ['Shift + Tab', '이전 요소로 이동한다. 첫 요소에서는 마지막 요소로 돌아간다.'],
      ['Esc', '다이얼로그를 닫고 트리거로 포커스를 되돌린다.'],
    ],
  },
  {
    slug: 'tabs',
    title: 'Tabs',
    summary: '로빙 tabindex로 탭 사이를 방향키로 이동합니다. 자동 활성화(automatic)와 수동 활성화(manual)를 지원합니다.',
    apg: { label: 'Tabs', href: `${APG}/tabs/` },
    examples: [{ title: '예제', description: 'manual과 vertical을 켜서 키보드 동작이 어떻게 바뀌는지 확인해 보세요.', node: <TabsExample /> }],
    code: `import { Tabs } from '@logic-ui-kit/primitives/tabs';

<Tabs.Root defaultValue="profile">
  <Tabs.List aria-label="계정 설정">
    <Tabs.Trigger value="profile">프로필</Tabs.Trigger>
    <Tabs.Trigger value="security">보안</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="profile">프로필 정보를 수정합니다.</Tabs.Content>
  <Tabs.Content value="security">비밀번호를 관리합니다.</Tabs.Content>
</Tabs.Root>`,
    parts: [
      {
        name: 'Tabs.Root',
        props: [
          { name: 'value', type: 'string', description: '제어 모드의 선택된 탭 값.' },
          { name: 'defaultValue', type: 'string', description: '비제어 모드의 초기 선택 값.' },
          { name: 'onValueChange', type: '(value: string) => void', description: '선택이 바뀌어야 할 때 호출된다.' },
          { name: 'orientation', type: "'horizontal' | 'vertical'", description: '방향키 축. horizontal은 ←/→, vertical은 ↑/↓.', default: "'horizontal'" },
          { name: 'activationMode', type: "'automatic' | 'manual'", description: 'automatic은 포커스 이동과 동시에 선택, manual은 Enter/Space로 선택한다.', default: "'automatic'" },
        ],
      },
      { name: 'Tabs.List', description: 'role="tablist". aria-label로 이름을 붙인다.' },
      {
        name: 'Tabs.Trigger',
        description: 'role="tab". 선택된 탭만 aria-controls를 가진다. disabled 탭은 방향키 이동에서 건너뛴다.',
        props: [{ name: 'value', type: 'string', description: '이 탭을 식별하는 값. 대응하는 Tabs.Content의 value와 같아야 한다.' }],
      },
      {
        name: 'Tabs.Content',
        description: 'role="tabpanel".',
        props: [
          { name: 'value', type: 'string', description: '대응하는 Tabs.Trigger의 value.' },
          { name: 'forceMount', type: 'boolean', description: '선택되지 않아도 DOM에 유지한다(hidden으로 숨김).' },
        ],
      },
    ],
    keys: [
      ['← / →', 'horizontal에서 이전/다음 탭으로 포커스를 옮긴다. 양 끝에서는 반대편으로 순환한다.'],
      ['↑ / ↓', 'vertical에서 이전/다음 탭으로 포커스를 옮긴다.'],
      ['Home / End', '첫/마지막 탭으로 포커스를 옮긴다.'],
      ['Enter / Space', 'manual 모드에서 포커스된 탭을 선택한다.'],
      ['Tab', '활성 탭에서 탭 패널로 이동한다.'],
    ],
  },
  {
    slug: 'accordion',
    title: 'Accordion',
    summary: '헤더로 패널을 펼치고 접습니다. 한 번에 하나(single) 또는 여러 개(multiple)를 열 수 있습니다.',
    apg: { label: 'Accordion', href: `${APG}/accordion/` },
    examples: [{ title: '예제', description: 'multiple과 collapsible 옵션을 바꿔 보세요.', node: <AccordionExample /> }],
    code: `import { Accordion } from '@logic-ui-kit/primitives/accordion';

<Accordion.Root type="single" collapsible defaultValue={['what']}>
  <Accordion.Item value="what">
    <Accordion.Header>
      <Accordion.Trigger>헤드리스 UI란?</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Content>스타일 없이 동작만 제공합니다.</Accordion.Content>
  </Accordion.Item>
</Accordion.Root>`,
    parts: [
      {
        name: 'Accordion.Root',
        props: [
          { name: 'type', type: "'single' | 'multiple'", description: 'single은 한 번에 하나만, multiple은 여러 개를 열 수 있다.', default: "'single'" },
          { name: 'value', type: 'string[]', description: '제어 모드의 열린 아이템 값 목록. single에서도 배열(최대 1개)이다.' },
          { name: 'defaultValue', type: 'string[]', description: '비제어 모드의 초기 열린 아이템 값 목록.' },
          { name: 'onValueChange', type: '(value: string[]) => void', description: '열린 아이템이 바뀌어야 할 때 호출된다.' },
          { name: 'collapsible', type: 'boolean', description: 'single에서 열린 아이템을 다시 눌러 닫을 수 있게 한다. false면 열린 트리거에 aria-disabled가 붙는다(APG 기본 동작).', default: 'false' },
          { name: 'disabled', type: 'boolean', description: '모든 아이템을 비활성화한다.' },
        ],
      },
      {
        name: 'Accordion.Item',
        props: [
          { name: 'value', type: 'string', description: '이 아이템을 식별하는 값.' },
          { name: 'disabled', type: 'boolean', description: '이 아이템만 비활성화한다.' },
        ],
      },
      { name: 'Accordion.Header', description: '기본은 h3. 문서의 제목 단계에 맞추려면 asChild로 다른 h 요소를 넘긴다.' },
      { name: 'Accordion.Trigger', description: '헤더 안의 버튼. aria-expanded와 aria-controls를 자동으로 연결한다.' },
      {
        name: 'Accordion.Content',
        description: 'role="region", aria-labelledby로 트리거를 가리킨다.',
        props: [{ name: 'forceMount', type: 'boolean', description: '닫혀 있어도 DOM에 유지한다(hidden으로 숨김).' }],
      },
    ],
    keys: [
      ['Enter / Space', '포커스된 헤더의 패널을 펼치거나 접는다.'],
      ['↓ / ↑', '다음/이전 헤더로 포커스를 옮긴다. 양 끝에서는 순환한다.'],
      ['Home / End', '첫/마지막 헤더로 포커스를 옮긴다.'],
      ['Tab', '다음 포커스 가능한 요소로 이동한다.'],
    ],
  },
  {
    slug: 'popover',
    title: 'Popover',
    summary: '트리거 옆에 뜨는 비모달 팝오버입니다. 공간이 부족하면 반대편으로 뒤집히고, Esc·바깥 클릭·포커스 이탈로 닫힙니다.',
    apg: { label: 'Dialog (비모달)', href: `${APG}/dialog-modal/` },
    examples: [{ title: '예제', description: '방향을 바꿔 가며 배치와 뒤집힘을 확인해 보세요.', node: <PopoverExample /> }],
    code: `import { Popover } from '@logic-ui-kit/primitives/popover';

<Popover.Root>
  <Popover.Trigger>크기 설정</Popover.Trigger>
  <Popover.Portal>
    <Popover.Content side="bottom" aria-label="크기 설정">
      <input aria-label="너비" />
      <Popover.Close>닫기</Popover.Close>
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>`,
    parts: [
      { name: 'Popover.Root', props: open },
      { name: 'Popover.Trigger', description: 'aria-haspopup="dialog", aria-expanded, aria-controls를 자동으로 연결한다.' },
      { ...portal, name: 'Popover.Portal' },
      {
        name: 'Popover.Content',
        description: 'role="dialog"(비모달). aria-label 또는 aria-labelledby로 이름을 붙인다.',
        props: [
          ...placement.map((p) => (p.name === 'align' ? { ...p, default: "'center'" } : p.name === 'side' ? { ...p, default: "'bottom'" } : p)),
          openAutoFocus,
          closeAutoFocus,
          escapeProp,
          pointerOutsideProp,
          {
            name: 'onFocusOutside',
            type: '(event: CustomEvent) => void',
            description: '포커스가 Content 바깥으로 이동했을 때 호출. preventDefault()로 닫힘을 막을 수 있다.',
          },
        ],
      },
      { name: 'Popover.Close', description: '누르면 닫는다.' },
    ],
    keys: [
      ['Enter / Space', '트리거에서 팝오버를 열거나 닫는다.'],
      ['Tab', '팝오버 안의 다음 요소로 이동한다. 바깥으로 나가면 팝오버가 닫힌다.'],
      ['Esc', '팝오버를 닫고 트리거로 포커스를 되돌린다.'],
    ],
  },
  {
    slug: 'tooltip',
    title: 'Tooltip',
    summary: '호버(지연 후)나 키보드 포커스로 열리고 Esc로 닫힙니다. 툴팁 위로 포인터를 옮겨도 유지되며, 터치에서는 호버로 열리지 않습니다.',
    apg: { label: 'Tooltip', href: `${APG}/tooltip/` },
    examples: [{ title: '예제', description: '버튼에 마우스를 올리거나 Tab으로 포커스해 보세요.', node: <TooltipExample /> }],
    code: `import { Tooltip } from '@logic-ui-kit/primitives/tooltip';

<Tooltip.Root delayDuration={700}>
  <Tooltip.Trigger>top</Tooltip.Trigger>
  <Tooltip.Portal>
    <Tooltip.Content side="top">툴팁 내용</Tooltip.Content>
  </Tooltip.Portal>
</Tooltip.Root>`,
    parts: [
      {
        name: 'Tooltip.Root',
        props: [
          ...open,
          { name: 'delayDuration', type: 'number', description: '포인터를 올린 뒤 열리기까지의 지연(ms). 포커스로 열 때는 적용되지 않는다.', default: '700' },
          { name: 'closeDelay', type: 'number', description: '포인터가 트리거를 벗어난 뒤 닫히기까지의 유예(ms). 이 사이 Content로 옮겨가면 유지된다.', default: '100' },
        ],
      },
      { name: 'Tooltip.Trigger', description: '열려 있을 때 aria-describedby로 Content를 가리킨다.' },
      { ...portal, name: 'Tooltip.Portal' },
      {
        name: 'Tooltip.Content',
        description: 'role="tooltip".',
        props: [...placement.map((p) => (p.name === 'side' ? { ...p, default: "'top'" } : p.name === 'align' ? { ...p, default: "'center'" } : p)), escapeProp],
      },
    ],
    keys: [
      ['Tab (포커스)', '트리거에 포커스가 오면 지연 없이 툴팁이 열린다.'],
      ['Esc', '툴팁을 닫는다.'],
    ],
  },
  {
    slug: 'menu',
    title: 'Menu',
    summary: '버튼으로 여는 액션 메뉴입니다. 일반 항목, 체크박스 항목, 라디오 그룹을 지원하며 글자 입력으로 항목을 찾을 수 있습니다.',
    apg: { label: 'Menu Button', href: `${APG}/menu-button/` },
    examples: [{ title: '예제', description: '파일 메뉴는 일반 항목과 비활성 항목, 보기 메뉴는 체크박스와 라디오 항목입니다.', node: <MenuExample /> }],
    code: `import { Menu } from '@logic-ui-kit/primitives/menu';

<Menu.Root>
  <Menu.Trigger>파일</Menu.Trigger>
  <Menu.Portal>
    <Menu.Content>
      <Menu.Item onSelect={() => save()}>저장</Menu.Item>
      <Menu.Item disabled>인쇄</Menu.Item>
      <Menu.Separator />
      <Menu.CheckboxItem checked={ruler} onCheckedChange={setRuler}>눈금자</Menu.CheckboxItem>
      <Menu.RadioGroup aria-label="정렬 기준" value={sort} onValueChange={setSort}>
        <Menu.RadioItem value="name">이름순</Menu.RadioItem>
        <Menu.RadioItem value="date">날짜순</Menu.RadioItem>
      </Menu.RadioGroup>
    </Menu.Content>
  </Menu.Portal>
</Menu.Root>`,
    parts: [
      { name: 'Menu.Root', props: open },
      { name: 'Menu.Trigger', description: 'aria-haspopup="menu", aria-expanded, aria-controls를 자동으로 연결한다. 메뉴의 접근 가능한 이름이 된다.' },
      { ...portal, name: 'Menu.Portal' },
      {
        name: 'Menu.Content',
        description: 'role="menu". 열리면 첫 항목(트리거에서 ↑로 열면 마지막 항목)에 포커스한다.',
        props: [
          ...placement.map((p) => (p.name === 'side' ? { ...p, default: "'bottom'" } : p.name === 'align' ? { ...p, default: "'start'" } : p)),
          openAutoFocus,
          closeAutoFocus,
          escapeProp,
          pointerOutsideProp,
        ],
      },
      {
        name: 'Menu.Item',
        description: 'role="menuitem".',
        props: [
          { name: 'disabled', type: 'boolean', description: '포커스 이동과 선택에서 제외된다. aria-disabled가 붙는다.' },
          { name: 'onSelect', type: '(event: Event) => void', description: '클릭·Enter·Space로 선택됐을 때 호출. preventDefault()하면 메뉴가 닫히지 않는다.' },
        ],
      },
      {
        name: 'Menu.CheckboxItem',
        description: 'role="menuitemcheckbox". Item의 props를 모두 받는다. 선택하면 상태는 항상 바뀌고, preventDefault()는 닫힘만 막는다.',
        props: [
          { name: 'checked', type: 'boolean', description: '제어 모드의 체크 상태.' },
          { name: 'defaultChecked', type: 'boolean', description: '비제어 모드의 초기 체크 상태.', default: 'false' },
          { name: 'onCheckedChange', type: '(checked: boolean) => void', description: '체크 상태가 바뀌어야 할 때 호출된다.' },
        ],
      },
      {
        name: 'Menu.RadioGroup',
        description: 'role="group". 안의 RadioItem 중 하나만 선택된다.',
        props: [
          { name: 'value', type: 'string', description: '제어 모드의 선택 값.' },
          { name: 'defaultValue', type: 'string', description: '비제어 모드의 초기 선택 값.' },
          { name: 'onValueChange', type: '(value: string) => void', description: '선택 값이 바뀌어야 할 때 호출된다.' },
        ],
      },
      {
        name: 'Menu.RadioItem',
        description: 'role="menuitemradio". Item의 props를 모두 받는다.',
        props: [{ name: 'value', type: 'string', description: '이 항목이 나타내는 값. 그룹의 value와 같으면 선택된 상태다.' }],
      },
      { name: 'Menu.Separator', description: 'role="separator".' },
    ],
    keys: [
      ['Enter / Space / ↓', '트리거에서 메뉴를 열고 첫 항목에 포커스한다.'],
      ['↑', '트리거에서 메뉴를 열고 마지막 항목에 포커스한다.'],
      ['↓ / ↑', '메뉴 안에서 다음/이전 항목으로 이동한다. 비활성 항목은 건너뛰고 양 끝에서는 순환한다.'],
      ['Home / End', '첫/마지막 항목으로 이동한다.'],
      ['글자 입력', '그 글자로 시작하는 다음 항목으로 이동한다. 같은 글자를 반복하면 순환하고, 이어서 입력하면 접두사로 찾는다. 한글 같은 IME 조합 입력에서는 동작하지 않는다.'],
      ['Enter / Space', '포커스된 항목을 선택한다. 기본적으로 메뉴가 닫히고 트리거로 포커스가 돌아간다.'],
      ['Esc', '메뉴를 닫고 트리거로 포커스를 되돌린다.'],
      ['Tab', '메뉴를 닫고 트리거로 포커스를 되돌린다.'],
    ],
  },
  {
    slug: 'switch',
    title: 'Switch',
    summary: '켜짐과 꺼짐 두 상태를 전환하는 스위치입니다. button에 role="switch"를 주어 Space와 Enter로 전환하고, label로 이름을 붙입니다.',
    apg: { label: 'Switch', href: `${APG}/switch/` },
    examples: [{ title: '예제', description: 'label을 눌러도 전환됩니다. 비활성 스위치는 포커스와 전환에서 제외됩니다.', node: <SwitchExample /> }],
    code: `import { Switch } from '@logic-ui-kit/primitives/switch';

<label htmlFor="airplane">비행기 모드</label>
<Switch.Root id="airplane" checked={on} onCheckedChange={setOn} name="airplane">
  <Switch.Thumb />
</Switch.Root>`,
    parts: [
      {
        name: 'Switch.Root',
        description: 'role="switch"인 button. name을 주면 폼 제출을 위한 숨은 체크박스 input을 함께 렌더한다.',
        props: [
          { name: 'checked', type: 'boolean', description: '제어 모드의 켜짐 상태.' },
          { name: 'defaultChecked', type: 'boolean', description: '비제어 모드의 초기 켜짐 상태.', default: 'false' },
          { name: 'onCheckedChange', type: '(checked: boolean) => void', description: '켜짐 상태가 바뀌어야 할 때 호출된다.' },
          { name: 'disabled', type: 'boolean', description: '비활성화. data-disabled가 붙는다.' },
          { name: 'name', type: 'string', description: '폼 제출용 이름. 켜져 있을 때만 값이 제출된다.' },
          { name: 'value', type: 'string', description: '켜져 있을 때 제출되는 값.', default: "'on'" },
        ],
      },
      { name: 'Switch.Thumb', description: '움직이는 손잡이. data-state="checked" | "unchecked"로 위치를 스타일링한다.' },
    ],
    keys: [
      ['Space', '켜짐과 꺼짐을 전환한다.'],
      ['Enter', '켜짐과 꺼짐을 전환한다(APG 선택 사항).'],
      ['Tab', '다음 포커스 가능한 요소로 이동한다.'],
    ],
  },
  {
    slug: 'checkbox',
    title: 'Checkbox',
    summary: '체크와 해제, 그리고 일부만 선택된 중간 상태(indeterminate)를 지원합니다. 부모-자식 체크박스 구성에서 부모를 중간 상태로 표시할 수 있습니다.',
    apg: { label: 'Checkbox', href: `${APG}/checkbox/` },
    examples: [{ title: '예제', description: '"모두 선택"은 자식 일부만 체크되면 중간 상태(aria-checked="mixed")가 됩니다.', node: <CheckboxExample /> }],
    code: `import { Checkbox } from '@logic-ui-kit/primitives/checkbox';

<label htmlFor="terms">이용약관 동의</label>
<Checkbox.Root id="terms" checked={checked} onCheckedChange={setChecked} name="terms">
  <Checkbox.Indicator>✓</Checkbox.Indicator>
</Checkbox.Root>`,
    parts: [
      {
        name: 'Checkbox.Root',
        description: 'role="checkbox"인 button. name을 주면 폼 제출용 숨은 체크박스 input을 함께 렌더한다(체크된 경우에만 값 제출).',
        props: [
          { name: 'checked', type: "boolean | 'indeterminate'", description: "제어 모드의 체크 상태. 'indeterminate'는 aria-checked=\"mixed\"."},
          { name: 'defaultChecked', type: "boolean | 'indeterminate'", description: '비제어 모드의 초기 체크 상태.', default: 'false' },
          { name: 'onCheckedChange', type: "(checked: boolean | 'indeterminate') => void", description: '체크 상태가 바뀌어야 할 때 호출된다. 중간 상태에서 누르면 true가 된다.' },
          { name: 'disabled', type: 'boolean', description: '비활성화. data-disabled가 붙는다.' },
          { name: 'name', type: 'string', description: '폼 제출용 이름.' },
          { name: 'value', type: 'string', description: '체크되어 있을 때 제출되는 값.', default: "'on'" },
        ],
      },
      {
        name: 'Checkbox.Indicator',
        description: '체크 또는 중간 상태일 때만 렌더되는 표시 영역. data-state="checked" | "indeterminate".',
        props: [{ name: 'forceMount', type: 'boolean', description: '체크되지 않았어도 렌더한다.' }],
      },
    ],
    keys: [
      ['Space', '체크 상태를 전환한다. 중간 상태에서는 체크된다.'],
      ['Tab', '다음 포커스 가능한 요소로 이동한다.'],
    ],
  },
  {
    slug: 'radio-group',
    title: 'Radio Group',
    summary: '여러 항목 중 하나만 선택합니다. 그룹 전체가 Tab 정지점 하나이고, 방향키가 포커스 이동과 선택을 함께 합니다.',
    apg: { label: 'Radio Group', href: `${APG}/radio/` },
    examples: [{ title: '예제', description: 'Tab으로 그룹에 들어간 뒤 방향키로 선택을 바꿔 보세요. 비활성 항목은 건너뜁니다.', node: <RadioGroupExample /> }],
    code: `import { RadioGroup } from '@logic-ui-kit/primitives/radio-group';

<RadioGroup.Root aria-label="요금제" value={plan} onValueChange={setPlan} name="plan">
  <RadioGroup.Item value="free" id="free"><RadioGroup.Indicator /></RadioGroup.Item>
  <label htmlFor="free">무료</label>
  <RadioGroup.Item value="pro" id="pro"><RadioGroup.Indicator /></RadioGroup.Item>
  <label htmlFor="pro">프로</label>
</RadioGroup.Root>`,
    parts: [
      {
        name: 'RadioGroup.Root',
        description: 'role="radiogroup". aria-label 또는 aria-labelledby로 이름을 붙인다.',
        props: [
          { name: 'value', type: 'string', description: '제어 모드의 선택 값.' },
          { name: 'defaultValue', type: 'string', description: '비제어 모드의 초기 선택 값.' },
          { name: 'onValueChange', type: '(value: string) => void', description: '선택 값이 바뀌어야 할 때 호출된다.' },
          { name: 'disabled', type: 'boolean', description: '모든 항목을 비활성화한다.' },
          { name: 'name', type: 'string', description: '폼 제출용 이름. 선택된 항목의 값만 제출된다.' },
          { name: 'required', type: 'boolean', description: 'aria-required를 붙인다.' },
          { name: 'orientation', type: "'horizontal' | 'vertical'", description: '스타일링용 data-orientation. 방향키 동작은 방향과 무관하다(APG).' },
        ],
      },
      {
        name: 'RadioGroup.Item',
        description: 'role="radio"인 button. 선택된 항목(없으면 첫 활성 항목)만 tabindex=0이다.',
        props: [
          { name: 'value', type: 'string', description: '이 항목이 나타내는 값.' },
          { name: 'disabled', type: 'boolean', description: '이 항목만 비활성화한다. 방향키 이동에서 건너뛴다.' },
        ],
      },
      {
        name: 'RadioGroup.Indicator',
        description: '선택된 항목에서만 렌더되는 표시 영역.',
        props: [{ name: 'forceMount', type: 'boolean', description: '선택되지 않았어도 렌더한다.' }],
      },
    ],
    keys: [
      ['Tab / Shift + Tab', '그룹 안으로 들어가 선택된 항목(없으면 첫 항목)에 포커스한다. 그룹을 벗어난다.'],
      ['↓ / →', '다음 항목으로 포커스를 옮기며 선택한다. 마지막에서는 첫 항목으로 순환한다.'],
      ['↑ / ←', '이전 항목으로 포커스를 옮기며 선택한다. 첫 항목에서는 마지막으로 순환한다.'],
      ['Space', '포커스된 항목이 선택되어 있지 않으면 선택한다.'],
    ],
  },
  {
    slug: 'progress',
    title: 'Progress',
    summary: '작업의 진행 정도를 보여 주는 표시 컴포넌트입니다. APG 패턴이 아니라 WAI-ARIA progressbar 역할을 따르며, 값을 알 수 없으면 indeterminate 상태가 되어 aria-valuenow를 생략합니다.',
    examples: [{ title: '예제', description: '버튼으로 값을 바꿔 보세요. 아래 막대는 진행 정도를 알 수 없는 상태입니다.', node: <ProgressExample /> }],
    code: `import { Progress } from '@logic-ui-kit/primitives/progress';

<span id="upload-label">업로드</span>
<Progress.Root aria-labelledby="upload-label" value={35} max={100}>
  <Progress.Indicator style={{ width: '35%' }} />
</Progress.Root>`,
    parts: [
      {
        name: 'Progress.Root',
        description: 'role="progressbar". aria-label 또는 aria-labelledby로 이름을 붙인다. data-state는 "loading" | "complete" | "indeterminate".',
        props: [
          { name: 'value', type: 'number | null', description: '현재 값(0~max). null·undefined이거나 범위를 벗어나면 indeterminate로 다룬다.' },
          { name: 'max', type: 'number', description: '최댓값.', default: '100' },
          { name: 'getValueLabel', type: '(value: number, max: number) => string', description: 'aria-valuetext로 쓸 값 설명. 예: "5단계 중 3단계".' },
        ],
      },
      { name: 'Progress.Indicator', description: '진행 정도를 그리는 요소. data-value, data-max, data-state를 보고 너비 등을 스타일링한다.' },
    ],
    keys: [['—', '키보드 상호작용이 없는 표시 컴포넌트입니다. 포커스를 받지 않습니다.']],
  },
  {
    slug: 'toggle-group',
    title: 'Toggle Group',
    summary: '켜고 끌 수 있는 버튼 묶음입니다. 한 번에 하나(single)나 여러 개(multiple)를 켤 수 있고, 그룹 전체가 Tab 정지점 하나입니다.',
    apg: { label: 'Button (toggle)', href: `${APG}/button/` },
    examples: [{ title: '예제', description: 'Tab으로 그룹에 들어간 뒤 방향키로 이동하고 Space/Enter로 켜고 끄세요. 방향키는 선택하지 않고 포커스만 옮깁니다.', node: <ToggleGroupExample /> }],
    code: `import { ToggleGroup } from '@logic-ui-kit/primitives/toggle-group';

<ToggleGroup.Root aria-label="서식" type="multiple" value={format} onValueChange={setFormat}>
  <ToggleGroup.Item value="bold">굵게</ToggleGroup.Item>
  <ToggleGroup.Item value="italic">기울임</ToggleGroup.Item>
</ToggleGroup.Root>`,
    parts: [
      {
        name: 'ToggleGroup.Root',
        description: 'role="group". aria-label 또는 aria-labelledby로 이름을 붙인다.',
        props: [
          { name: 'type', type: "'single' | 'multiple'", description: 'single은 한 번에 하나만, multiple은 여러 개를 켤 수 있다. single에서 켜진 항목을 다시 누르면 꺼진다.', default: "'single'" },
          { name: 'value', type: 'string[]', description: '제어 모드의 켜진 항목 값 목록. single에서도 배열(최대 1개)이다.' },
          { name: 'defaultValue', type: 'string[]', description: '비제어 모드의 초기 켜진 항목 값 목록.' },
          { name: 'onValueChange', type: '(value: string[]) => void', description: '켜진 항목이 바뀌어야 할 때 호출된다.' },
          { name: 'disabled', type: 'boolean', description: '모든 항목을 비활성화한다.' },
          { name: 'orientation', type: "'horizontal' | 'vertical'", description: '방향키 축. horizontal은 ←/→, vertical은 ↑/↓.', default: "'horizontal'" },
          { name: 'loop', type: 'boolean', description: '양 끝에서 반대편으로 순환한다.', default: 'true' },
        ],
      },
      {
        name: 'ToggleGroup.Item',
        description: 'aria-pressed인 button. data-state="on" | "off". 마지막으로 포커스한 항목(처음에는 켜진 첫 항목)이 tabindex=0이다.',
        props: [
          { name: 'value', type: 'string', description: '이 항목을 식별하는 값.' },
          { name: 'disabled', type: 'boolean', description: '이 항목만 비활성화한다. 방향키 이동에서 건너뛴다.' },
        ],
      },
    ],
    keys: [
      ['Tab / Shift + Tab', '그룹의 탭 정지점(처음에는 켜진 첫 항목)에 포커스하고 그룹을 벗어난다.'],
      ['→ / ←', 'horizontal에서 다음/이전 항목으로 포커스를 옮긴다(선택하지 않음). 끝에서는 순환한다.'],
      ['↓ / ↑', 'vertical에서 다음/이전 항목으로 포커스를 옮긴다.'],
      ['Home / End', '첫/마지막 활성 항목으로 포커스를 옮긴다.'],
      ['Space / Enter', '포커스된 항목을 켜거나 끈다.'],
    ],
  },
  {
    slug: 'breadcrumb',
    title: 'Breadcrumb',
    summary: '현재 페이지까지의 경로를 보여 주는 내비게이션입니다. nav landmark 안의 순서 있는 목록이고, 현재 페이지에 aria-current="page"를 붙입니다.',
    apg: { label: 'Breadcrumb', href: `${APG}/breadcrumb/` },
    examples: [{ title: '예제', description: 'Tab은 링크만 지나가고 현재 페이지와 구분자는 건너뜁니다.', node: <BreadcrumbExample /> }],
    code: `import { Breadcrumb } from '@logic-ui-kit/primitives/breadcrumb';

<Breadcrumb.Root aria-label="현재 위치">
  <Breadcrumb.List>
    <Breadcrumb.Item><Breadcrumb.Link href="/">홈</Breadcrumb.Link></Breadcrumb.Item>
    <Breadcrumb.Separator />
    <Breadcrumb.Item><Breadcrumb.Link href="/docs">문서</Breadcrumb.Link></Breadcrumb.Item>
    <Breadcrumb.Separator />
    <Breadcrumb.Item><Breadcrumb.Page>메뉴</Breadcrumb.Page></Breadcrumb.Item>
  </Breadcrumb.List>
</Breadcrumb.Root>`,
    parts: [
      { name: 'Breadcrumb.Root', description: 'nav landmark. 기본 aria-label은 "Breadcrumb"이며 문서 언어에 맞게 바꾼다.' },
      { name: 'Breadcrumb.List', description: '순서 있는 목록(ol).' },
      { name: 'Breadcrumb.Item', description: '목록 항목(li).' },
      { name: 'Breadcrumb.Link', description: '상위 페이지로 가는 링크(a). 라우터의 Link를 쓰려면 asChild로 넘긴다.' },
      { name: 'Breadcrumb.Page', description: '현재 페이지. role="link", aria-disabled="true", aria-current="page".' },
      { name: 'Breadcrumb.Separator', description: '항목 사이 구분자(li). 장식이라 aria-hidden이며 기본 내용은 "/"다.' },
    ],
    keys: [
      ['Tab / Shift + Tab', '상위 경로 링크 사이를 이동한다. 현재 페이지와 구분자는 포커스를 받지 않는다.'],
      ['Enter', '포커스된 링크로 이동한다.'],
    ],
  },
];
