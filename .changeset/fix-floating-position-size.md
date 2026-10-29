---
'@logic-ui/primitives': patch
---

Popover·Tooltip 위치 계산이 진입 애니메이션(`scale`) 도중의 크기를 써서 콘텐츠가 trigger와 겹치던 문제를 고칩니다. 이제 transform의 영향을 받지 않는 레이아웃 크기로 계산합니다.
