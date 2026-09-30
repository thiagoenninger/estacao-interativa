import { readTokenValue } from './readTokenValue';

const PRIMITIVES = [
  'paper-50',
  'paper-100',
  'paper-200',
  'paper-300',
  'pencil-500',
  'graphite-700',
  'ink-900',
  'oxide-500',
  'oxide-700',
  'malachite-600',
  'white',
] as const;

/** Semantic tokens (Foundations 01) with the primitive each one uses and where it applies. */
const SEMANTIC = [
  ['color-background-primary', 'paper-100', 'Fundo de toda a experiência'],
  ['color-background-secondary', 'paper-200', 'Áreas recuadas; superfície pressionada'],
  ['color-surface', 'paper-50', 'Botões, etiquetas, tile de símbolo'],
  ['color-text-primary', 'ink-900', 'Títulos e corpo'],
  ['color-text-secondary', 'graphite-700', 'Overlines, apoio, rótulos de dados'],
  ['color-text-tertiary', 'pencil-500', 'Símbolos, escalas, notas'],
  ['color-text-accent', 'oxide-500', 'Numeração, família · símbolo ativo'],
  ['color-text-inverse', 'paper-50', 'Texto sobre óxido ou tinta'],
  ['color-orbit-line', 'ink-900 · 28%', 'Anel orbital'],
  ['color-orbit-active', 'oxide-500', 'Arco e anel do material selecionado'],
  ['color-divider', 'paper-300', 'Divisores discretos'],
  ['color-divider-strong', 'ink-900', 'Fio de abertura do painel'],
  ['color-border-interactive', 'ink-900', 'Borda de botão primário'],
  ['color-border-interactive-secondary', 'graphite-700', 'Borda de botão secundário'],
  ['color-state-active', 'oxide-500', 'Elemento selecionado'],
  ['color-state-pressed', 'oxide-700', 'Feedback de toque'],
  ['color-hotspot-core', 'oxide-500', 'Núcleo do hotspot'],
  ['color-hotspot-ring', 'oxide-500 · 90%', 'Anel interno do hotspot'],
  ['color-hotspot-ring-outer', 'oxide-500 · 35%', 'Anel externo (pulso)'],
  ['color-hotspot-halo', 'paper-50 · 70%', 'Halo do hotspot sobre o objeto'],
  ['color-feedback-connection', 'malachite-600', 'Trilha percorrida, conexões'],
  ['color-pattern-lattice', 'ink-900 · 16%', 'Retícula do fundo'],
] as const;

function PrimitiveSwatch({ name }: { name: string }) {
  const value = readTokenValue(`--${name}`);
  return (
    <div className="swatch" data-testid="primitive-swatch">
      <div className="swatch-color" style={{ background: `var(--${name})` }} />
      <span className="type-data">{name}</span>
      <span className="type-data showcase-caption">{value || '—'}</span>
    </div>
  );
}

export function ColorsTab() {
  return (
    <>
      <h2 className="type-overline showcase-heading">Primitivos · paleta mineral</h2>
      <div className="swatch-grid">
        {PRIMITIVES.map((name) => (
          <PrimitiveSwatch key={name} name={name} />
        ))}
      </div>
      <h2 className="type-overline showcase-heading" style={{ marginTop: 'var(--space-6)' }}>
        Tokens semânticos
      </h2>
      <div className="token-list">
        {SEMANTIC.map(([token, primitive, usage]) => (
          <div className="token-row" key={token} data-testid="semantic-token">
            <div className="token-row-color" style={{ background: `var(--${token})` }} />
            <div className="token-row-text">
              <span className="type-data">
                {token} · {primitive}
              </span>
              <span className="type-caption showcase-caption">{usage}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
