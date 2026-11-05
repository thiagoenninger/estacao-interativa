import { useExperience, type Level } from '../experience/index.ts';
import './app.css';

const LEVEL_NAME: Record<Level, string> = {
  universe: 'universo',
  object: 'objeto',
  material: 'material',
  layer: 'camada',
};

export function SessionReadout() {
  const level = useExperience((store) => store.level);
  const objectId = useExperience((store) => store.objectId);
  const warning = useExperience((store) => store.warning);

  return (
    <div className="session-readout" data-testid="session-readout">
      sessão · nível {LEVEL_NAME[level]} · objeto {objectId ?? '—'} · aviso{' '}
      {warning ? 'sim' : 'não'}
    </div>
  );
}
