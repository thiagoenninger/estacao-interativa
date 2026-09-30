import type { ComponentPropsWithoutRef } from 'react';
import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/icon-names';
import './buttons.css';
import { usePress } from './usePress';

export interface IconButtonProps extends Omit<
  ComponentPropsWithoutRef<'button'>,
  'onClick' | 'type' | 'children' | 'aria-label'
> {
  icon: IconName;
  label: string;
  onPress?: () => void;
  pressed?: boolean;
}

export function IconButton({
  icon,
  label,
  onPress,
  pressed: forcedPressed,
  disabled,
  className,
  ...rest
}: IconButtonProps) {
  const { pressed, handlers } = usePress({ disabled, onPress });
  const classes = ['button', 'button--primary', 'button--icon-only', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      {...rest}
      {...handlers}
      className={classes}
      disabled={disabled}
      aria-label={label}
      data-pressed={forcedPressed ?? pressed}
    >
      <Icon name={icon} size="md" />
    </button>
  );
}
