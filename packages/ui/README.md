# @logic-ui-kit/ui

[`@logic-ui-kit/primitives`](https://www.npmjs.com/package/@logic-ui-kit/primitives) 위에 Tailwind CSS 클래스만 입힌 레퍼런스 디자인 시스템입니다. 동작과 접근성은 전부 primitives가 담당하고, 이 패키지는 `className`만 다룹니다.

**[데모 보기 →](https://logicui.vercel.app)**

## 설치

```bash
pnpm add @logic-ui-kit/ui
```

`react`, `react-dom` 18 이상과 Tailwind CSS v4가 필요합니다. primitives는 함께 설치됩니다.

이 패키지는 CSS를 번들하지 않습니다. 사용하는 앱의 CSS에서 패키지를 스캔하도록 등록하세요.

```css
@import 'tailwindcss';

/* CSS 파일 기준 node_modules 상대 경로 */
@source '../node_modules/@logic-ui-kit/ui/dist';

/* 클래스 기반 다크 모드를 쓸 때 */
@custom-variant dark (&:where(.dark, .dark *));
```

## 사용

```tsx
import { Button, Dialog } from '@logic-ui-kit/ui';

<Dialog.Root>
  <Dialog.Trigger asChild>
    <Button>프로필 편집</Button>
  </Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <Dialog.Title>프로필 편집</Dialog.Title>
      <Dialog.Description>변경 사항을 저장하세요.</Dialog.Description>
      <Dialog.Close asChild>
        <Button variant="secondary">닫기</Button>
      </Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>;
```

## 컴포넌트

`Dialog`, `Tabs`, `Accordion`, `Popover`, `Tooltip`, `Button`(`primary` · `secondary` · `ghost`)와 클래스 병합 유틸 `cn`을 내보냅니다.

소비자가 넘긴 `className`은 `cn()`(clsx + tailwind-merge)으로 병합되어 기본 스타일을 덮어씁니다.

## 라이선스

MIT
