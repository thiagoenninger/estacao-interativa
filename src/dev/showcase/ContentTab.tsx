import { Button } from '../../design-system/buttons/Button';
import { loadContent, summarizeIssues } from '../../content';
import { useState } from 'react';

const sphereUrls = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>('../../../assets/materials/material-*-sphere.png', {
      eager: true,
      query: '?url',
      import: 'default',
    }),
  ).map(([path, url]) => [path.split('/').pop() ?? path, url]),
);

const STATE_LABEL = {
  enabled: 'habilidtado',
  disabled: 'deshabilitado',
} as const;
const LAYER_LABEL = {
  available: 'disponível',
  'coming-soon': 'EM BREVE',
} as const;

export function ContentTab() {
  const [loaded] = useState(() => loadContent());
  const index = loaded.index;
  const summary = summarizeIssues(loaded.issues);
  const objects = index?.listObjects() ?? [];
  const [objectId, setObjectId] = useState('bicycle');
  const [materialId, setMaterialId] = useState('aluminium');

  const orbit = index?.getOrbit(objectId) ?? [];
  const sheet = index?.getMaterialSheet(objectId, materialId);

  return (
    <div className="content-tab">
      <div className="content-column">
        <section data-testid="content-summary">
          <h2 className="type-overline showcase-heading">Validação dos dados</h2>
          <p className="type-body">
            {summary.errors} {summary.errors === 1 ? 'erro' : 'erros'} · {summary.warnings}{' '}
            {summary.warnings === 1 ? 'aviso' : 'avisos'}
          </p>
          <ul className="content-codes">
            {summary.byCode.map(([code, count, severity]) => (
              <li key={code} className="type-data" data-severity={severity}>
                {count} × {code}
              </li>
            ))}
          </ul>
        </section>

        {sheet ? (
          <section data-testid="content-sheet">
            <h2 className="type-overline showcase-heading">
              Ficha · {sheet.name} em {index?.getObject(objectId)?.name}
            </h2>
            <ul className="content-facts">
              {sheet.facts.map((fact) => (
                <li key={fact.label} className="type-body">
                  <span className="type-caption">{fact.label}</span> {fact.value}
                </li>
              ))}
            </ul>
            <p className="type-body">{sheet.why ?? 'Sem texto sobre o porquê.'}</p>
            <ul className="content-layers">
              {sheet.layers.map((layer) => (
                <li
                  key={layer.id}
                  className="type-data"
                  data-testid="sheet-layer"
                  data-status={layer.status}
                >
                  {layer.title} · {LAYER_LABEL[layer.status]}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <section>
        <h2 className="type-overline showcase-heading">Objetos · {objects.length}</h2>
        <div className="showcase-row">
          {objects.map((object) => (
            <Button
              key={object.id}
              variant={object.id === objectId ? 'primary' : 'secondary'}
              aria-pressed={object.id === objectId}
              onPress={() => {
                setObjectId(object.id);
                setMaterialId(index?.getOrbit(object.id)[0]?.materialId ?? '');
              }}
            >
              {object.name}
            </Button>
          ))}
        </div>

        <h2 className="type-overline showcase-heading" style={{ marginTop: 'var(--space-6)' }}>
          Órbita · {orbit.length} {orbit.length === 1 ? 'material' : 'materiais'}
        </h2>
        <div className="showcase-row">
          {orbit.map((node) => (
            <button
              key={node.materialId}
              type="button"
              className="orbit-chip"
              data-testid="orbit-node"
              data-state={node.state}
              aria-pressed={node.materialId === materialId}
              onClick={() => setMaterialId(node.materialId)}
            >
              <img src={sphereUrls[node.sphere]} alt="" width={64} height={64} />
              <span className="type-heading-3">{node.name}</span>
              <span className="type-data">{STATE_LABEL[node.state]}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
