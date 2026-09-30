import { useRef, useState, type MouseEvent, type PointerEvent } from 'react';

interface UsePressOptions {
  disabled?: boolean;
  onPress?: () => void;
}

export function usePress({ disabled = false, onPress }: UsePressOptions) {
  const [pressed, setPressed] = useState(false);
  const activePointer = useRef<number | null>(null);

  function isInside(event: PointerEvent<HTMLElement>): boolean {
    const box = event.currentTarget.getBoundingClientRect();
    return (
      event.clientX >= box.left &&
      event.clientX <= box.right &&
      event.clientY >= box.top &&
      event.clientY <= box.bottom
    );
  }

  function finish() {
    activePointer.current = null;
    setPressed(false);
  }

  const handlers = {
    onPointerDown(event: PointerEvent<HTMLElement>) {
      if (disabled || activePointer.current !== null) return;
      activePointer.current = event.pointerId;
      setPressed(true);
    },
    onPointerMove(event: PointerEvent<HTMLElement>) {
      if (event.pointerId !== activePointer.current) return;
      setPressed(isInside(event));
    },
    onPointerUp(event: PointerEvent<HTMLElement>) {
      if (event.pointerId !== activePointer.current) return;
      const inside = isInside(event);
      finish();
      if (inside) onPress?.();
    },
    onPointerCancel(event: PointerEvent<HTMLElement>) {
      if (event.pointerId === activePointer.current) finish();
    },
    onPointerLeave(event: PointerEvent<HTMLElement>) {
      // A touch keeps the target until it is released; only the mouse needs this.
      if (event.pointerId === activePointer.current && event.pointerType === 'mouse') finish();
    },
    onClick(event: MouseEvent<HTMLElement>) {
      if (event.detail === 0 && !disabled) onPress?.();
    },
  };

  return { pressed, handlers };
}
