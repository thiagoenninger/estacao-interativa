import { Button, type ButtonProps } from './Button';

type NavigationButtonProps = Omit<ButtonProps, 'variant' | 'icon' | 'children'> & {
  label?: string;
};

/** Back Button */
export function BackButton({ label = 'Voltar', ...props }: NavigationButtonProps) {
  return (
    <Button variant="primary" icon="back" {...props}>
      {label}
    </Button>
  );
}

/** Home Button: */
export function HomeButton({ label = 'Início', ...props }: NavigationButtonProps) {
  return (
    <Button variant="secondary" icon="home" {...props}>
      {label}
    </Button>
  );
}
