# @logic-ui-kit/primitives

## 0.3.0

### Minor Changes

- dc6bd27: AlertDialog 프리미티브(WAI-ARIA Alert Dialog 패턴)와 Tailwind 스타일 AlertDialog를 추가합니다.
- 3229983: Breadcrumb 프리미티브(WAI-ARIA Breadcrumb 패턴)와 Tailwind 스타일 Breadcrumb을 추가합니다.
- a27ebf6: Checkbox 프리미티브(WAI-ARIA Checkbox 패턴, 중간 상태 포함)와 Tailwind 스타일 Checkbox를 추가합니다.
- 3243f48: Combobox 프리미티브(WAI-ARIA Editable Combobox with List Autocomplete 패턴)와 Tailwind 스타일 Combobox를 추가합니다.
- 324bd0d: Progress 프리미티브(WAI-ARIA progressbar 역할)와 Tailwind 스타일 Progress를 추가합니다.
- 7fd6812: RadioGroup 프리미티브(WAI-ARIA Radio Group 패턴)와 Tailwind 스타일 RadioGroup을 추가합니다.
- a898702: Select 프리미티브(WAI-ARIA Select-Only Combobox 패턴)와 Tailwind 스타일 Select를 추가합니다.
- c3d2946: Slider 프리미티브(WAI-ARIA Slider 패턴, 단일 썸)와 Tailwind 스타일 Slider를 추가합니다.
- f01a4c2: Switch 프리미티브(WAI-ARIA Switch 패턴)와 Tailwind 스타일 Switch를 추가합니다.
- 6757aaa: Toast 프리미티브(WAI-ARIA live region, 호버·포커스 중 자동 닫힘 일시정지, F8 단축키)와 Tailwind 스타일 Toast를 추가합니다.
- d66c527: ToggleGroup 프리미티브(single/multiple, 로빙 포커스)와 Tailwind 스타일 ToggleGroup을 추가합니다.

### Patch Changes

- 7ccd09f: Combobox에서 한글 등 IME 조합 중에 누른 Enter·방향키를 옵션 선택·이동으로 처리하지 않도록 고칩니다.

## 0.2.0

### Minor Changes

- cc8dd2f: Menu 프리미티브(WAI-ARIA Menu Button 패턴)와 Tailwind 스타일 Menu를 추가합니다. Item, CheckboxItem, RadioGroup/RadioItem, Separator를 지원하며 서브메뉴는 아직 지원하지 않습니다.

## 0.1.1

### Patch Changes

- 1f0e528: npm 패키지 페이지에 README, LICENSE, 저장소·홈페이지·키워드 메타데이터를 추가합니다. 코드 변경은 없습니다.

## 0.1.0

### Minor Changes

- bb910e0: Accordion 프리미티브와 Tailwind 스타일 Accordion을 추가합니다.
- 725c318: Popover 프리미티브와 Tailwind 스타일 Popover를 추가합니다.
- 08d4b6e: Tabs 프리미티브와 Tailwind 스타일 Tabs를 추가합니다.
- 8ba3e28: Tooltip 프리미티브와 Tailwind 스타일 Tooltip을 추가합니다.
- c5c299c: Dialog 프리미티브와 Tailwind 스타일 Dialog를 처음 추가합니다.

### Patch Changes

- 3052a90: Popover·Tooltip 위치 계산이 진입 애니메이션(`scale`) 도중의 크기를 써서 콘텐츠가 trigger와 겹치던 문제를 고칩니다. 이제 transform의 영향을 받지 않는 레이아웃 크기로 계산합니다.
