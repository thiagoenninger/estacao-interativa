import { useEffect, useState } from 'react';

/** The twelve styles (Foundations 02) with the sample text of the Design System. */
const STYLES = [
  [
    'type-display',
    'Você sabe do que as coisas são feitas?',
    'Plex Sans · Bold 700 · 96 / 100 px · -0,03em',
    'left',
  ],
  [
    'type-heading-1',
    'Onde mais o alumínio é usado?',
    'Plex Sans · Regular 400 · 56 / 64 px · -0,015em',
    'left',
  ],
  [
    'type-heading-2',
    'Da bauxita ao metal',
    'Plex Sans · Medium 500 · 40 / 48 px · -0,01em',
    'left',
  ],
  ['type-heading-3', 'Refino e eletrólise', 'Plex Sans · SemiBold 600 · 28 / 36 px', 'left'],
  ['type-material-name', 'Alumínio', 'Plex Sans · Light 300 · 72 / 76 px · -0,02em', 'left'],
  [
    'type-object-name',
    'Bicicleta',
    'Plex Mono · Medium 500 · caixa alta · 18 / 24 px · +0,14em',
    'left',
  ],
  [
    'type-body-large',
    'Toque em um objeto para descobrir.',
    'Plex Sans · Regular 400 · 28 / 40 px',
    'right',
  ],
  [
    'type-body',
    'Tem cerca de um terço da densidade do aço e resiste bem à corrosão.',
    'Plex Sans · Regular 400 · 24 / 36 px',
    'right',
  ],
  [
    'type-overline',
    'Presente em',
    'Plex Mono · Medium 500 · caixa alta · 16 / 24 px · +0,12em',
    'right',
  ],
  [
    'type-data',
    'Metal · Al · 2,70 g/cm³',
    'Plex Mono · Regular 400 · 18 / 24 px · +0,04em',
    'right',
  ],
  [
    'type-caption',
    'Bauxita, principal minério do alumínio. Foto: [crédito]',
    'Plex Sans · Regular 400 · 18 / 26 px',
    'right',
  ],
  [
    'type-interactive-label',
    'Voltar · Alumínio',
    'Plex Sans Condensed · SemiBold 600 · caixa alta · 20 / 24 px · +0,08em',
    'right',
  ],
] as const;

/** The eight font faces the experience uses. */
const FACES = [
  ['Sans 300', '300 24px "IBM Plex Sans"'],
  ['Sans 400', '400 24px "IBM Plex Sans"'],
  ['Sans 500', '500 24px "IBM Plex Sans"'],
  ['Sans 600', '600 24px "IBM Plex Sans"'],
  ['Sans 700', '700 24px "IBM Plex Sans"'],
  ['Condensed 600', '600 24px "IBM Plex Sans Condensed"'],
  ['Mono 400', '400 24px "IBM Plex Mono"'],
  ['Mono 500', '500 24px "IBM Plex Mono"'],
] as const;

function FontStatus() {
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!document.fonts) return;
    for (const [label, font] of FACES) {
      document.fonts
        .load(font, 'Aáçõ')
        .then((faces) => setLoaded((current) => ({ ...current, [label]: faces.length > 0 })))
        .catch(() => setLoaded((current) => ({ ...current, [label]: false })));
    }
  }, []);

  const count = Object.values(loaded).filter(Boolean).length;
  return (
    <div className="font-status" data-testid="font-status">
      <span className="type-overline">
        Fontes locais · {count} de {FACES.length} carregadas
      </span>
      {FACES.map(([label]) => (
        <span
          key={label}
          className="type-data font-status-item"
          data-loaded={String(loaded[label] ?? false)}
        >
          {label} {loaded[label] ? '✓' : '·'}
        </span>
      ))}
    </div>
  );
}

function Column({ side }: { side: 'left' | 'right' }) {
  return (
    <div>
      {STYLES.filter((style) => style[3] === side).map(([token, sample, spec]) => (
        <div className="type-sample" key={token} data-testid="type-sample">
          <div className={token}>{sample}</div>
          <div className="type-data type-sample-spec">
            {token} · {spec}
          </div>
        </div>
      ))}
    </div>
  );
}

export function TypographyTab() {
  return (
    <>
      <FontStatus />
      <div className="showcase-columns showcase-columns--typography">
        <Column side="left" />
        <Column side="right" />
      </div>
    </>
  );
}
