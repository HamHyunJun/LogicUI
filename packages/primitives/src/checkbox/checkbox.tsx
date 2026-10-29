import * as React from 'react';
import { composeEventHandlers } from '../shared/compose-event-handlers';
import { getComp, type AsChildProps } from '../shared/primitive';
import { useControllableState } from '../shared/use-controllable-state';

/*
 * WAI-ARIA APG Checkbox 패턴 (이중 상태 + 중간 상태 `mixed`).
 * Space로 전환한다. Enter는 APG에 없으므로 막는다.
 */

export type CheckedState = boolean | 'indeterminate';

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/

interface CheckboxContextValue {
  checked: CheckedState;
  disabled: boolean;
}

const CheckboxContext = React.createContext<CheckboxContextValue | null>(null);

function useCheckboxContext(part: string): CheckboxContextValue {
  const context = React.useContext(CheckboxContext);
  if (!context) {
    throw new Error(`<Checkbox.${part}>은(는) <Checkbox.Root> 안에서만 사용할 수 있습니다.`);
  }
  return context;
}

const getState = (checked: CheckedState) => (checked === 'indeterminate' ? 'indeterminate' : checked ? 'checked' : 'unchecked');

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/

export interface CheckboxRootProps extends Omit<React.ComponentPropsWithoutRef<'button'>, 'value' | 'defaultValue' | 'defaultChecked'>, AsChildProps {
  /** 제어 모드의 체크 상태. 'indeterminate'는 중간 상태(aria-checked="mixed")다. */
  checked?: CheckedState;
  /** 비제어 모드의 초기 체크 상태. */
  defaultChecked?: CheckedState;
  /** 체크 상태가 바뀌어야 할 때 호출된다. 중간 상태에서 누르면 true가 된다. */
  onCheckedChange?: (checked: CheckedState) => void;
  /** 폼 제출용 이름. 지정하면 숨은 체크박스 input을 함께 렌더한다. */
  name?: string;
  /** 폼 제출 시 체크되어 있을 때 보내는 값. 기본값 on. */
  value?: string;
}

export const CheckboxRoot = React.forwardRef<HTMLButtonElement, CheckboxRootProps>(
  (
    { asChild, checked: checkedProp, defaultChecked = false, onCheckedChange, name, value = 'on', disabled = false, onClick, onKeyDown, ...props },
    forwardedRef,
  ) => {
    const [checked, setChecked] = useControllableState<CheckedState>({ prop: checkedProp, defaultProp: defaultChecked, onChange: onCheckedChange });
    const context = React.useMemo<CheckboxContextValue>(() => ({ checked, disabled }), [checked, disabled]);
    const Comp = getComp('button', asChild);
    return (
      <CheckboxContext.Provider value={context}>
        <Comp
          type={asChild ? undefined : 'button'}
          role="checkbox"
          aria-checked={checked === 'indeterminate' ? 'mixed' : checked}
          disabled={disabled}
          data-state={getState(checked)}
          data-disabled={disabled ? '' : undefined}
          {...props}
          ref={forwardedRef}
          onKeyDown={composeEventHandlers(onKeyDown, (event: React.KeyboardEvent) => {
            if (event.key === 'Enter') event.preventDefault();
          })}
          onClick={composeEventHandlers(onClick, () => setChecked(checked === 'indeterminate' ? true : !checked))}
        />
        {name !== undefined && (
          <input
            type="checkbox"
            hidden
            aria-hidden="true"
            tabIndex={-1}
            readOnly
            name={name}
            value={value}
            checked={checked === true}
            disabled={disabled}
          />
        )}
      </CheckboxContext.Provider>
    );
  },
);
CheckboxRoot.displayName = 'Checkbox.Root';

/* -------------------------------------------------------------------------------------------------
 * Indicator
 * -----------------------------------------------------------------------------------------------*/

export interface CheckboxIndicatorProps extends React.ComponentPropsWithoutRef<'span'>, AsChildProps {
  /** 체크되지 않았어도 렌더한다. */
  forceMount?: boolean;
}

/** 체크 또는 중간 상태일 때만 렌더되는 표시 영역. */
export const CheckboxIndicator = React.forwardRef<HTMLSpanElement, CheckboxIndicatorProps>(
  ({ asChild, forceMount, ...props }, forwardedRef) => {
    const context = useCheckboxContext('Indicator');
    if (!(forceMount || context.checked !== false)) return null;
    const Comp = getComp('span', asChild);
    return <Comp data-state={getState(context.checked)} data-disabled={context.disabled ? '' : undefined} {...props} ref={forwardedRef} />;
  },
);
CheckboxIndicator.displayName = 'Checkbox.Indicator';

/* -------------------------------------------------------------------------------------------------
 * 합성 컴포넌트용 짧은 이름
 * -----------------------------------------------------------------------------------------------*/

export { CheckboxRoot as Root, CheckboxIndicator as Indicator };
