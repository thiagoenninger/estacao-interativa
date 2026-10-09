import { useEffect, useRef, type CSSProperties } from 'react';
import { Background } from '../../design-system/background/Background';
import type { ObjectItem } from '../../content';
import { UNIVERSE_SIZE } from '../../object/drawing-measures';
import { ObjectDrawing } from '../../object/ObjectDrawing';
import {
  effectsOf,
  PHASE_INTERVAL_MS,
  showsSelection,
  SPIKE_MATERIAL,
  SPIKE_OBJECT_ID,
  type SceneId,
} from './scenes';
import './spike.css';

const SPHERE_URLS = Object.values(
  import.meta.glob<string>('../../../assets/materials/material-*-sphere.png', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
).slice(0, 5);

const ORBIT_RADIUS = 400;
const ORBIT_NODE_STEP = 72;
const FLOAT_AMPLITUDE = { near: 6, mid: 4, far: 3 } as const;

function floatStyle(item: ObjectItem, index: number) {
  return {
    '--float-amplitude': `${FLOAT_AMPLITUDE[item.plane]}px`,
    '--float-period': `${8 + ((index * 1.7) % 6)}s`,
    '--float-delay': `${-((index * 2.3) % 8)}s`,
  } as CSSProperties;
}

function orbitPoint(angle: number) {
  const radians = (angle * Math.PI) / 180;
  return { x: ORBIT_RADIUS * Math.cos(radians), y: -ORBIT_RADIUS * Math.sin(radians) };
}

const ARC_START = orbitPoint(-22);
const ARC_END = orbitPoint(22);
const ARC_PATH = `M ${ARC_START.x} ${ARC_START.y} A ${ORBIT_RADIUS} ${ORBIT_RADIUS} 0 0 0 ${ARC_END.x} ${ARC_END.y}`;

const PANEL_BLOCKS = ['Origem', 'Extração', 'Transformação', 'Aplicações', 'Presente em'] as const;

interface SpikeStageProps {
  scene: SceneId;
  objects: readonly ObjectItem[];
}

/**
 * The page the performance test draws: the universe floating, the selected object, the orbit and,
 * in the full M02 scenes, the information panel. It fills the whole Stage, because what costs is
 * the number of pixels drawn. The change of phase is made on the element, not through React, so
 * the measurement does not include any rendering of ours.
 */
export function SpikeStage({ scene, objects }: SpikeStageProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const effects = effectsOf(scene);
  const hasCopy = effects.includes('recede-copy');
  const hasPanel = effects.includes('panel');
  const withSelection = showsSelection(scene);
  const selected = objects.find((item) => item.id === SPIKE_OBJECT_ID);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || effects.length === 0) return;
    const timer = setInterval(() => {
      root.dataset['phase'] = root.dataset['phase'] === 'a' ? 'b' : 'a';
    }, PHASE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [effects]);

  return (
    <div
      ref={rootRef}
      className="spike"
      data-testid="spike-stage"
      data-scene={scene}
      data-fx={effects.join(' ')}
      data-selected={withSelection}
      data-phase="a"
    >
      <Background />

      <div className="spike-universe">
        {objects
          .filter((item) => !withSelection || item.id !== SPIKE_OBJECT_ID)
          .map((item, index) => (
            <div
              key={item.id}
              className="spike-slot"
              style={{ left: item.position.x, top: item.position.y }}
            >
              <div className="spike-scale">
                <div className="spike-float" style={floatStyle(item, index)}>
                  <ObjectDrawing
                    file={item.svg}
                    label={item.name}
                    view="universe"
                    size={UNIVERSE_SIZE[item.plane]}
                  />
                </div>
              </div>
            </div>
          ))}
      </div>

      {withSelection && (
        <>
          <svg
            className="spike-connector"
            width="1920"
            height="1080"
            viewBox="0 0 1920 1080"
            aria-hidden="true"
          >
            <line x1="1056" y1="540" x2="1264" y2="540" pathLength={1} />
          </svg>

          <div className="spike-center">
            {selected && (
              <div className="spike-layers">
                {hasCopy && (
                  <div className="spike-layer spike-layer--base">
                    <ObjectDrawing file={selected.svg} label={selected.name} view="selected" />
                  </div>
                )}
                <div className="spike-layer spike-layer--lit">
                  <ObjectDrawing
                    file={selected.svg}
                    label={selected.name}
                    view="selected"
                    material={SPIKE_MATERIAL}
                  />
                </div>
              </div>
            )}
            <div className="spike-orbit">
              <svg width="808" height="808" viewBox="-404 -404 808 808" aria-hidden="true">
                <circle className="spike-ring" cx="0" cy="0" r={ORBIT_RADIUS} pathLength={1} />
                <path className="spike-arc" d={ARC_PATH} pathLength={1} />
              </svg>
              {SPHERE_URLS.map((url, index) => {
                const point = orbitPoint(90 + index * ORBIT_NODE_STEP);
                return (
                  <img
                    key={url}
                    className={index === 0 ? 'spike-node spike-node--selected' : 'spike-node'}
                    style={{ '--node-x': point.x, '--node-y': point.y } as CSSProperties}
                    src={url}
                    alt=""
                  />
                );
              })}
            </div>
          </div>
        </>
      )}

      {hasPanel && (
        <div className="spike-panel">
          {PANEL_BLOCKS.map((title, index) => (
            <section
              key={title}
              className="spike-block"
              style={{ '--block': index } as CSSProperties}
            >
              <h3 className="type-overline">{title}</h3>
              <p className="type-body">
                Texto de teste do painel de informação, com a mesma largura de coluna do desenho
                final.
              </p>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
