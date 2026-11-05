import { useRef } from 'react';
import type { ObjectItem } from '../content/index.ts';
import { usePress } from '../design-system/buttons/usePress.ts';
import { useFloat } from '../motion/index.ts';
import { UNIVERSE_SIZE } from '../object/drawing-measures.ts';
import { fitSize } from '../object/drawing-state.ts';
import { getDrawing } from '../object/object-source.ts';
import { ObjectDrawing } from '../object/ObjectDrawing';
import './universe.css';

interface UniverseObjectProps {
  item: ObjectItem;
  faded?: boolean;
  onSelect?: (objectId: string) => void;
}

export function UniverseObject({ item, faded = false, onSelect }: UniverseObjectProps) {
  const floatRef = useRef<HTMLDivElement>(null);
  const { viewBox } = getDrawing(item.svg);
  const box = fitSize(viewBox, UNIVERSE_SIZE[item.plane]);

  useFloat(floatRef, { depth: item.plane, mode: faded ? 'faded' : 'free' });
  const { pressed, handlers } = usePress({ onPress: () => onSelect?.(item.id) });

  return (
    <div
      className="universe-object"
      data-testid="universe-object"
      data-object={item.id}
      data-plane={item.plane}
      data-state={faded ? 'faded' : 'default'}
      data-pressed={pressed}
      style={{
        left: item.position.x - box.width / 2,
        top: item.position.y - box.height / 2,
        width: box.width,
        height: box.height,
      }}
    >
      <div ref={floatRef} className="universe-object__float" data-testid="universe-float">
        <div className="universe-object__body" aria-hidden="true">
          <ObjectDrawing
            file={item.svg}
            label={item.name}
            view="universe"
            size={UNIVERSE_SIZE[item.plane]}
          />
          <span className="universe-object__label type-object-name">{item.name}</span>
        </div>
      </div>
      <button
        type="button"
        className="universe-object__target"
        aria-label={item.name}
        {...handlers}
      />
    </div>
  );
}
