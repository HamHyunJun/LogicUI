# @logic-ui-kit/primitives

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
