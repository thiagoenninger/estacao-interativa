import { Button } from '@/design-system/buttons/Button';
import { loadContent, type ContentIndex } from '../../content';
import {
  ExperienceProvider,
  acceptedEvents,
  createCatalog,
  createScaledClock,
  createSession,
  createSystemClock,
  useExperience,
  useSession,
  type Level,
  type ScaledClock,
  type UserEvent,
  type UserEventType,
} from '../../experience';
import { formatNumber } from '../spike/format';
import { createDemoCatalog } from './demo-catalog';
import { useCallback, useEffect, useRef, useState } from 'react';

type CatalogMode = 'real' | 'demo';

const MODES: [CatalogMode, string][] = [
  ['real', 'Conteúdo real'],
  ['demo', 'Tudo aberto (demonstração)'],
];

const SPEEDS = [1, 5, 20, 60] as const;

const LEVEL_LABEL: Record<Level, string> = {
  universe: '01 · Universo',
  object: '03 · Objeto selecionado',
  material: '04/05 · Material selecionado',
  layer: 'Camada aprofundada',
};

const EVENT_LABEL: Record<UserEventType, string> = {
  'select-object': 'Selecionar objeto',
  'select-material': 'Selecionar material',
  'select-present-in': 'Item de "Presente em"',
  'open-layer': 'Abrir ou trocar camada',
  'open-related': 'Objeto relacionado',
  back: 'Voltar',
  home: 'Início',
  'touch-background': 'Tocar no fundo',
  'touch-warning': 'Tocar no aviso',
};

const PHASE_LABEL = {
  off: 'desligado (universo)',
  counting: 'contando',
  warning: 'aviso na tela',
} as const;

interface LogEntry {
  id: number;
  label: string;
  result: string;
  level: Level;
}

const LOG_LIMIT = 40;

function useTick(ms: number): void {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((tick) => tick + 1), ms);
    return () => window.clearInterval(id);
  }, [ms]);
}

const seconds = (ms: number | null): string =>
  ms === null ? '-' : `${formatNumber(ms / 1000, 1)} s`;

export function ExperienceTab() {
  const [loaded] = useState(() => loadContent());
  const [mode, setMode] = useState<CatalogMode>('real');
  const [clock] = useState(() => createScaledClock(createSystemClock()));
  const [speed, setSpeed] = useState(1);
  const index = loaded.index;

  if (!index) return <p className="type-body">Conteúdo indisponível.</p>;

  return (
    <div className="experience-tab" data-testid="experience-tab">
      <div className="experience-header">
        <section>
          <h2 className="type-overline showcase-heading">Conteúdo</h2>
          <div className="showcase-row">
            {MODES.map(([id, label]) => (
              <Button
                key={id}
                variant={id === mode ? 'primary' : 'secondary'}
                aria-pressed={id === mode}
                onPress={() => setMode(id)}
              >
                {label}
              </Button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="type-overline showcase-heading">Velocidade do tempo</h2>
          <div className="showcase-row">
            {SPEEDS.map((value) => (
              <Button
                key={value}
                variant={value === speed ? 'primary' : 'secondary'}
                aria-pressed={value === speed}
                onPress={() => {
                  clock.setSpeed(value);
                  setSpeed(value);
                }}
              >
                {`${value}×`}
              </Button>
            ))}
          </div>
        </section>
      </div>
      <Panel key={mode} index={index} mode={mode} clock={clock} />
    </div>
  );
}

interface PanelProps {
  index: ContentIndex;
  mode: CatalogMode;
  clock: ScaledClock;
}

function Panel({ index, mode, clock }: PanelProps) {
  const [catalog] = useState(() =>
    mode === 'demo' ? createDemoCatalog(index) : createCatalog(index),
  );
  const [session] = useState(() => createSession({ catalog, clock }));
  const [log, setLog] = useState<LogEntry[]>([]);
  const nextId = useRef(1);
  const fromVisitor = useRef(false);

  const addEntry = useCallback(
    (label: string, result: string) => {
      const { level } = session.store.getState();
      const id = nextId.current++;
      setLog((entries) => [{ id, label, result, level }, ...entries].slice(0, LOG_LIMIT));
    },
    [session],
  );

  useEffect(() => {
    const unsubscribe = session.store.subscribe((state, previous) => {
      if (fromVisitor.current) return;
      if (state.warning && !previous.warning) addEntry('Aviso de retorno (50 s)', 'automático');
      else if (state.level === 'universe' && previous.level !== 'universe') {
        addEntry('Retorno automático (60 s)', 'automático');
      }
    });
    return () => {
      unsubscribe();
      session.dispose();
    };
  }, [session, addEntry]);

  function press(label: string, event: UserEvent) {
    fromVisitor.current = true;
    const changed = session.dispatch(event);
    fromVisitor.current = false;
    addEntry(label, changed ? 'aplicado' : 'sem efeito');
  }

  return (
    <ExperienceProvider session={session}>
      <div className="experience-columns">
        <div className="experience-column" data-testid="experience-state-column">
          <StatePanel index={index} />
          <IdlePanel />
        </div>
        <div className="experience-column experience-column--controls">
          <Controls index={index} catalogMode={mode} press={press} />
        </div>
        <div className="experience-column">
          <Accepted />
          <section className="experience-log-section">
            <h2 className="type-overline showcase-heading">Registro</h2>
            <ol className="experience-log" data-testid="experience-log">
              {log.length === 0 && (
                <li className="type-caption showcase-caption">Nenhum evento ainda.</li>
              )}
              {log.map((entry) => (
                <li
                  key={entry.id}
                  className="experience-log-entry type-data"
                  data-result={entry.result}
                  data-testid="experience-log-entry"
                >
                  <span>{entry.label}</span>
                  <span>{`${entry.result} · ${LEVEL_LABEL[entry.level]}`}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </ExperienceProvider>
  );
}

function StatePanel({ index }: { index: ContentIndex }) {
  const state = useExperience((store) => store);
  const objectName = (id: string) => index.getObject(id)?.name ?? id;
  const materialName = (id: string) => index.getMaterial(id)?.name ?? id;
  const trailText = state.trail
    .map((node) => (node.kind === 'object' ? objectName(node.id) : materialName(node.id)))
    .join(' · ');

  const facts: [string, string, string][] = [
    ['level', 'Nível', LEVEL_LABEL[state.level]],
    ['object', 'Objeto', state.objectId ? objectName(state.objectId) : '—'],
    ['material', 'Material', state.materialId ? materialName(state.materialId) : '—'],
    ['layer', 'Camada', state.layerId ?? '—'],
    [
      'present',
      'Presente em',
      state.presentInN === null ? '—' : String(state.presentInN).padStart(2, '0'),
    ],
    ['trail', 'Trilha', trailText || '—'],
    ['warning', 'Aviso de retorno', state.warning ? 'na tela' : 'não'],
  ];

  return (
    <section>
      <h2 className="type-overline showcase-heading">Estado</h2>
      <dl className="experience-facts">
        {facts.map(([id, label, value]) => (
          <div className="experience-fact" key={id}>
            <dt className="type-data showcase-caption">{label}</dt>
            <dd className="type-body" data-testid={`experience-fact-${id}`}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function IdlePanel() {
  const session = useSession();
  useTick(100);
  const snapshot = session.idle.snapshot();
  const share = Math.min(1, snapshot.elapsedMs / (snapshot.elapsedMs + (snapshot.returnInMs ?? 1)));

  return (
    <section>
      <h2 className="type-overline showcase-heading">Inatividade</h2>
      <dl className="experience-facts">
        <div className="experience-fact">
          <dt className="type-data showcase-caption">Contagem</dt>
          <dd className="type-body" data-testid="experience-idle-phase">
            {PHASE_LABEL[snapshot.phase]}
          </dd>
        </div>
        <div className="experience-fact">
          <dt className="type-data showcase-caption">Sem toque há</dt>
          <dd className="type-body" data-testid="experience-idle-elapsed">
            {seconds(snapshot.elapsedMs)}
          </dd>
        </div>
        <div className="experience-fact">
          <dt className="type-data showcase-caption">Aviso em</dt>
          <dd className="type-body" data-testid="experience-idle-warn">
            {seconds(snapshot.warnInMs)}
          </dd>
        </div>
        <div className="experience-fact">
          <dt className="type-data showcase-caption">Retorno em</dt>
          <dd className="type-body" data-testid="experience-idle-return">
            {seconds(snapshot.returnInMs)}
          </dd>
        </div>
      </dl>
      <div className="experience-bar" data-phase={snapshot.phase} aria-hidden="true">
        <div className="experience-bar-fill" style={{ width: `${Math.round(share * 100)}%` }} />
      </div>
    </section>
  );
}

function Accepted() {
  const level = useExperience((store) => store.level);
  const accepted = acceptedEvents(level);
  return (
    <section>
      <h2 className="type-overline showcase-heading">O que este nível aceita</h2>
      <ul className="experience-accepted" data-testid="experience-accepted">
        {accepted.map((type) => (
          <li className="type-data" key={type}>
            {EVENT_LABEL[type]}
          </li>
        ))}
      </ul>
      <p className="type-caption showcase-note">
        Fundo e aviso nunca mudam de nível. Qualquer toque fecha o aviso e reinicia a contagem.
      </p>
    </section>
  );
}

interface ControlsProps {
  index: ContentIndex;
  catalogMode: CatalogMode;
  press: (label: string, event: UserEvent) => void;
}

function Controls({ index, catalogMode, press }: ControlsProps) {
  const session = useSession();
  const { objectId, materialId, layerId, presentInN } = useExperience((store) => store);
  const catalog = catalogMode === 'demo' ? createDemoCatalog(index) : createCatalog(index);
  const sheet = objectId && materialId ? index.getMaterialSheet(objectId, materialId) : undefined;
  const orbit = objectId ? index.getOrbit(objectId) : [];

  return (
    <>
      <section>
        <h2 className="type-overline showcase-heading">Navegação e toques</h2>
        <div className="experience-buttons">
          <Button variant="secondary" onPress={() => press('Voltar', { type: 'back' })}>
            Voltar
          </Button>
          <Button variant="secondary" onPress={() => press('Início', { type: 'home' })}>
            Início
          </Button>
          <Button
            variant="secondary"
            onPress={() => press('Tocar no fundo', { type: 'touch-background' })}
          >
            Tocar no fundo
          </Button>
          <Button
            variant="secondary"
            onPress={() => press('Tocar no aviso', { type: 'touch-warning' })}
          >
            Tocar no aviso
          </Button>
          <Button variant="secondary" onPress={() => session.touch()}>
            Toque sem evento
          </Button>
        </div>
      </section>

      <section>
        <h2 className="type-overline showcase-heading">Objeto</h2>
        <div className="experience-buttons">
          {index.listObjects().map((item) => (
            <Button
              key={item.id}
              variant={item.id === objectId ? 'primary' : 'secondary'}
              onPress={() =>
                press(`Objeto: ${item.name}`, { type: 'select-object', objectId: item.id })
              }
            >
              {item.name}
            </Button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="type-overline showcase-heading">Material</h2>
        <div className="experience-buttons">
          {orbit.length === 0 && (
            <p className="type-caption showcase-caption">Escolha um objeto primeiro.</p>
          )}
          {orbit.map((node) => {
            const open = objectId !== null && catalog.isMaterialOpen(objectId, node.materialId);
            return (
              <Button
                key={node.materialId}
                variant={node.materialId === materialId ? 'primary' : 'secondary'}
                onPress={() =>
                  press(`Material: ${node.name}`, {
                    type: 'select-material',
                    materialId: node.materialId,
                  })
                }
              >
                {open ? node.name : `${node.name} · sem conteúdo`}
              </Button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="type-overline showcase-heading">Presente em</h2>
        <div className="experience-buttons">
          {!sheet && <p className="type-caption showcase-caption">Escolha um material primeiro.</p>}
          {sheet?.presentIn.map((item) => (
            <Button
              key={item.n}
              variant={item.n === presentInN ? 'primary' : 'secondary'}
              onPress={() =>
                press(`Presente em ${item.n}: ${item.label}`, {
                  type: 'select-present-in',
                  n: item.n,
                })
              }
            >
              {`${String(item.n).padStart(2, '0')} ${item.label}`}
            </Button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="type-overline showcase-heading">Camadas e objetos relacionados</h2>
        <div className="experience-buttons">
          {sheet?.layers.map((layer) => {
            const open =
              objectId !== null &&
              materialId !== null &&
              catalog.isLayerOpen(objectId, materialId, layer.id);
            return (
              <Button
                key={layer.id}
                variant={layer.id === layerId ? 'primary' : 'secondary'}
                onPress={() =>
                  press(`Camada: ${layer.title}`, { type: 'open-layer', layerId: layer.id })
                }
              >
                {open ? layer.title : `${layer.title} · EM BREVE`}
              </Button>
            );
          })}
          {sheet?.related.map((item) => {
            const open =
              objectId !== null &&
              materialId !== null &&
              catalog.canOpenRelated(objectId, materialId, item.objectId);
            return (
              <Button
                key={item.objectId}
                variant="secondary"
                onPress={() =>
                  press(`Relacionado: ${item.name}`, {
                    type: 'open-related',
                    objectId: item.objectId,
                  })
                }
              >
                {open
                  ? `Relacionado: ${item.name}`
                  : `Relacionado: ${item.name} · sem este material`}
              </Button>
            );
          })}
          {!sheet && <p className="type-caption showcase-caption">Escolha um material primeiro.</p>}
        </div>
      </section>
    </>
  );
}
