import * as React from 'react';
import { composeEventHandlers } from '../shared/compose-event-handlers';
import { getComp, type AsChildProps } from '../shared/primitive';
import { useControllableState } from '../shared/use-controllable-state';

/*
 * WAI-ARIA APG Switch 패턴. button 요소에 role="switch"를 준다.
 * Space로 전환하며(APG 필수), 버튼의 기본 동작 덕분에 Enter도 전환한다.
 */

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/

interface SwitchContextValue {
  checked: boolean;
  disabled: boolean;
}

const SwitchContext = React.createContext<SwitchContextValue | null>(null);

function useSwitchContext(part: string): SwitchContextValue {
  const context = React.useContext(SwitchContext);
  if (!context) {
    throw new Error(`<Switch.${part}>은(는) <Switch.Root> 안에서만 사용할 수 있습니다.`);
  }
  return context;
}

const getState = (checked: boolean) => (checked ? 'checked' : 'unchecked');

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/

export interface SwitchRootProps extends Omit<React.ComponentPropsWithoutRef<'button'>, 'value' | 'defaultValue'>, AsChildProps {
  /** 제어 모드의 켜짐 상태. */
  checked?: boolean;
  /** 비제어 모드의 초기 켜짐 상태. */
  defaultChecked?: boolean;
  /** 켜짐 상태가 바뀌어야 할 때 호출된다. */
  onCheckedChange?: (checked: boolean) => void;
  /** 폼 제출용 이름. 지정하면 숨은 체크박스 input을 함께 렌더한다. */
  name?: string;
  /** 폼 제출 시 켜져 있을 때 보내는 값. 기본값 on. */
  value?: string;
}

export const SwitchRoot = React.forwardRef<HTMLButtonElement, SwitchRootProps>(
  (
    { asChild, checked: checkedProp, defaultChecked = false, onCheckedChange, name, value = 'on', disabled = false, onClick, ...props },
    forwardedRef,
  ) => {
    const [checked, setChecked] = useControllableState({ prop: checkedProp, defaultProp: defaultChecked, onChange: onCheckedChange });
    const context = React.useMemo<SwitchContextValue>(() => ({ checked, disabled }), [checked, disabled]);
    const Comp = getComp('button', asChild);
    return (
      <SwitchContext.Provider value={context}>
        <Comp
          type={asChild ? undefined : 'button'}
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          data-state={getState(checked)}
          data-disabled={disabled ? '' : undefined}
          {...props}
          ref={forwardedRef}
          onClick={composeEventHandlers(onClick, () => setChecked(!checked))}
        />
        {name !== undefined && (
          // 폼에 값을 전달하기 위한 숨은 input. 상호작용은 button이 담당한다.
          <input type="checkbox" hidden aria-hidden="true" tabIndex={-1} readOnly name={name} value={value} checked={checked} disabled={disabled} />
        )}
      </SwitchContext.Provider>
    );
  },
);
SwitchRoot.displayName = 'Switch.Root';

/* -------------------------------------------------------------------------------------------------
 * Thumb
 * -----------------------------------------------------------------------------------------------*/

export type SwitchThumbProps = React.ComponentPropsWithoutRef<'span'> & AsChildProps;

export const SwitchThumb = React.forwardRef<HTMLSpanElement, SwitchThumbProps>(({ asChild, ...props }, forwardedRef) => {
  const context = useSwitchContext('Thumb');
  const Comp = getComp('span', asChild);
  return <Comp data-state={getState(context.checked)} data-disabled={context.disabled ? '' : undefined} {...props} ref={forwardedRef} />;
});
SwitchThumb.displayName = 'Switch.Thumb';

/* -------------------------------------------------------------------------------------------------
 * 합성 컴포넌트용 짧은 이름
 * -----------------------------------------------------------------------------------------------*/

export { SwitchRoot as Root, SwitchThumb as Thumb };
