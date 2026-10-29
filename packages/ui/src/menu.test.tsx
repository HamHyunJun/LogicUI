import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Menu } from './index';

describe('ui/Menu', () => {
  // tailwind-merge가 px-3 뒤의 pl-9를 지워 체크·라디오 표시가 글자와 겹치던 회귀를 막는다.
  it('체크박스·라디오 항목은 표시 영역을 위한 왼쪽 여백(pl-9)을 유지한다', () => {
    render(
      <Menu.Root defaultOpen>
        <Menu.Trigger>보기</Menu.Trigger>
        <Menu.Portal>
          <Menu.Content>
            <Menu.CheckboxItem defaultChecked>눈금자</Menu.CheckboxItem>
            <Menu.RadioGroup aria-label="정렬" defaultValue="name">
              <Menu.RadioItem value="name">이름순</Menu.RadioItem>
            </Menu.RadioGroup>
          </Menu.Content>
        </Menu.Portal>
      </Menu.Root>,
    );
    for (const item of [screen.getByRole('menuitemcheckbox', { name: '눈금자' }), screen.getByRole('menuitemradio', { name: '이름순' })]) {
      expect(item).toHaveClass('pl-9', 'px-3');
    }
  });

  it('소비자 className이 기본 스타일을 덮어쓴다', () => {
    render(
      <Menu.Root defaultOpen>
        <Menu.Trigger>메뉴</Menu.Trigger>
        <Menu.Portal>
          <Menu.Content>
            <Menu.Item className="py-4">항목</Menu.Item>
          </Menu.Content>
        </Menu.Portal>
      </Menu.Root>,
    );
    const item = screen.getByRole('menuitem', { name: '항목' });
    expect(item).toHaveClass('py-4');
    expect(item).not.toHaveClass('py-2');
  });
});
