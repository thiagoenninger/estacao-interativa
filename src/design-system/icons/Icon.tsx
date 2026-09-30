import { ICON_SIZE, type IconName, type IconSize } from './icon-names';
import { getIconMarkup } from './icon-source';

interface IconProps {
  name: IconName;
  size?: IconSize;
  label?: string;
  className?: string;
}

export function Icon({ name, size = 'md', label, className }: IconProps) {
  const pixels = ICON_SIZE[size];

  return (
    <svg
      className={className}
      width={pixels}
      height={pixels}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      data-icon={name}
      dangerouslySetInnerHTML={{ __html: getIconMarkup(name) }}
    />
  );
}
