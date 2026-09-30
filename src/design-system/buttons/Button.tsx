import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/icon-names';
import './buttons.css';
import { usePress } from './usePress';

export type ButtonVariant = 'primary' | 'secondary';

export interface ButtonProps extends Omit<
  ComponentPropsWithoutRef<'button'>,
  'onClick' | 'type' | 'children'
> {
  children: ReactNode;
  /** primary: 2 px border and surface fill · secondary: 1.5 px border, no fill. */
  variant?: ButtonVariant;
  /** Optional icon before the label. Without it, the button is text only. */
  icon?: IconName;
  /** Runs on touch end, inside the target. */
  onPress?: () => void;
  /** Forces the pressed look. Only for the showcase and tests. */
  pressed?: boolean;
}

/* Interactive Button */
export function Button({
  children,
  variant = 'primary',
  icon,
  onPress,
  pressed: forcedPressed,
  disabled,
  className,
  ...rest
}: ButtonProps) {
  const { pressed, handlers } = usePress({ disabled, onPress });
  const classes = ['button', `button--${variant}`, icon ? 'button--with-icon' : '', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      {...rest}
      {...handlers}
      className={classes}
      disabled={disabled}
      data-pressed={forcedPressed ?? pressed}
    >
      {icon && <Icon name={icon} size="md" />}
      <span className="type-interactive-label">{children}</span>
    </button>
  );
}
