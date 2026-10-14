import type { TouchGate } from './touch-gate.ts';

interface Attachment {
  users: number;
  detach: () => void;
}

const attachments = new Map<TouchGate, Attachment>();

function listen(gate: TouchGate): () => void {
  const down = (event: PointerEvent) => {
    gate.pointerDown({
      id: event.pointerId,
      type: event.pointerType,
      isPrimary: event.isPrimary,
    });
  };
  const up = (event: PointerEvent) => gate.pointerUp(event.pointerId);
  const move = (event: PointerEvent) => {
    if (event.pointerType === 'mouse' && event.buttons === 0) gate.pointerUp(event.pointerId);
  };
  const lostFocus = () => gate.reset();

  window.addEventListener('pointerdown', down, true);
  window.addEventListener('pointermove', move, true);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
  window.addEventListener('blur', lostFocus);
  return () => {
    window.removeEventListener('pointerdown', down, true);
    window.removeEventListener('pointermove', move, true);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    window.removeEventListener('blur', lostFocus);
  };
}

export function acquireTouchGate(gate: TouchGate): () => void {
  let attachment = attachments.get(gate);
  if (!attachment) {
    attachment = { users: 0, detach: listen(gate) };
    attachments.set(gate, attachment);
  }
  attachment.users += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    const current = attachments.get(gate);
    if (!current) return;
    current.users -= 1;
    if (current.users === 0) {
      current.detach();
      attachments.delete(gate);
    }
  };
}
