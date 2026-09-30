const SPACE = [0, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 128] as const;
const RADIUS = ['radius-none', 'radius-xs', 'radius-full'] as const;
const STROKE = ['stroke-hairline', 'stroke-thin', 'stroke-regular', 'stroke-strong'] as const;
const OPACITY = [
  'opacity-full',
  'opacity-material-secondary',
  'opacity-universe-muted',
  'opacity-universe-muted-panel',
  'opacity-object-recede',
  'opacity-disabled',
  'opacity-orbit',
  'opacity-lattice',
] as const;
const DEPTH = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90] as const;

export function SpaceShapeTab() {
  return (
    <div className="showcase-columns showcase-columns--4">
      <div>
        <h2 className="type-overline showcase-heading">Espaço · base 8</h2>
        {SPACE.map((pixels, index) => (
          <div className="space-bar-row" key={pixels}>
            <span className="type-data space-label">space-{index}</span>
            <div className="space-bar" style={{ width: pixels }} />
            <span className="type-data showcase-caption">{pixels}</span>
          </div>
        ))}
      </div>
      <div>
        <h2 className="type-overline showcase-heading">Raio</h2>
        {RADIUS.map((token) => (
          <div className="showcase-cell" key={token} style={{ marginBottom: 'var(--space-5)' }}>
            <div className="shape-box" style={{ borderRadius: `var(--${token})` }} />
            <span className="type-data">{token}</span>
          </div>
        ))}
        <h2 className="type-overline showcase-heading">Traço</h2>
        {STROKE.map((token) => (
          <div className="showcase-cell" key={token} style={{ marginBottom: 'var(--space-3)' }}>
            <div
              style={{
                width: 'var(--space-10)',
                borderTop: `var(--${token}) solid var(--color-text-primary)`,
              }}
            />
            <span className="type-data">{token}</span>
          </div>
        ))}
      </div>
      <div>
        <h2 className="type-overline showcase-heading">Opacidade</h2>
        {OPACITY.map((token) => (
          <div className="opacity-row" key={token}>
            <div className="opacity-box" style={{ opacity: `var(--${token})` }} />
            <span className="type-data">{token}</span>
          </div>
        ))}
      </div>
      <div>
        <h2 className="type-overline showcase-heading">Profundidade · z-index conceitual</h2>
        {[...DEPTH].reverse().map((level) => (
          <div className="type-data" key={level} style={{ height: 'var(--space-7)' }}>
            depth-{level}
          </div>
        ))}
        <p className="type-caption showcase-note">Sem sombras de interface.</p>
      </div>
    </div>
  );
}
