import { Icon } from '../../design-system/icons/Icon';
import { ICON_NAMES, ICON_SIZE } from '../../design-system/icons/icon-names';

export function IconsTab() {
  return (
    <>
      <h2 className="type-overline showcase-heading">
        Conjunto próprio · 12 ícones · grade 24 × 24 · traço 1,5 px
      </h2>
      <div className="icon-grid">
        {ICON_NAMES.map((name) => (
          <div className="icon-cell" key={name} data-testid="icon-cell">
            <div className="icon-touch-area">
              <Icon name={name} size="md" />
            </div>
            <span className="type-data">icon-{name}</span>
          </div>
        ))}
      </div>
      <h2 className="type-overline showcase-heading" style={{ marginTop: 'var(--space-8)' }}>
        Tamanhos
      </h2>
      <div className="showcase-row">
        {(Object.keys(ICON_SIZE) as Array<keyof typeof ICON_SIZE>).map((size) => (
          <div className="showcase-cell" key={size}>
            <Icon name="explore" size={size} />
            <span className="type-data">
              icon-{size} · {ICON_SIZE[size]} px
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
