import { useState } from 'react';
import { Button } from '../../design-system/buttons/Button';
import { loadContent, summarizeIssues } from '../../content';
import { auditDrawing } from '../../object/audit';
import { THUMBNAIL_SIZE, UNIVERSE_SIZE } from '../../object/drawing-measures';
import { getDrawing, getObjectSource } from '../../object/object-source';
import { ObjectDrawing } from '../../object/ObjectDrawing';
import type { DrawingView } from '../../object/drawing-state';
import { walkElements } from '../../object/svg-tree';

const VIEWS: [DrawingView, string][] = [
  ['universe', 'Universo'],
  ['selected', 'Selecionado'],
  ['thumbnail', 'Miniatura'],
];

function materialsOf(file: string): string[] {
  const found = new Set<string>();
  for (const element of walkElements(getDrawing(file).root)) {
    const material = element.attributes['data-material'];
    if (material) found.add(material);
  }
  return [...found];
}

export function ObjectsTab() {
  const [loaded] = useState(() => loadContent());
  const index = loaded.index;
  const objects = index?.listObjects() ?? [];
  const [objectId, setObjectId] = useState('bicycle');
  const [view, setView] = useState<DrawingView>('selected');
  const [material, setMaterial] = useState<string | null>(null);

  const object = index?.getObject(objectId);
  if (!object) return <p className="type-body">Conteúdo indisponível</p>;

  const materials = materialsOf(object.svg);
  const source = getObjectSource(object.svg) ?? '';
  const audit = auditDrawing(object.svg, source, { plane: object.plane });
  const summary = summarizeIssues(audit.issues);
  const levels = audit.stats?.levels ?? [];

  return (
    <div className="objects-tab" data-testid="objects-tab">
      <div className="objects-column">
        <section>
          <h2 className="type-overline showcase-heading">Objeto</h2>
          <div className="showcase-row">
            {objects.map((item) => (
              <Button
                key={item.id}
                variant={item.id === objectId ? 'primary' : 'secondary'}
                aria-pressed={item.id === objectId}
                onPress={() => {
                  setObjectId(item.id);
                  setMaterial(null);
                }}
              >
                {item.name}
              </Button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="type-overline showcase-heading">Visão</h2>
          <div className="showcase-row">
            {VIEWS.map(([id, name]) => (
              <Button
                key={id}
                variant={id === view ? 'primary' : 'secondary'}
                aria-pressed={id === view}
                onPress={() => setView(id)}
              >
                {name}
              </Button>
            ))}
          </div>
          <p className="type-caption showcase-note">
            Universo e miniatura mostram o nível 0; Selecionado mostra os níveis 0 e 1.
          </p>
        </section>

        <section>
          <h2 className="type-overline showcase-heading">Material destacado</h2>
          <div className="showcase-row">
            <Button
              variant={material === null ? 'primary' : 'secondary'}
              aria-pressed={material === null}
              onPress={() => setMaterial(null)}
            >
              Nenhum
            </Button>
            {materials.map((slug) => (
              <Button
                key={slug}
                variant={slug === material ? 'primary' : 'secondary'}
                aria-pressed={slug === material}
                onPress={() => setMaterial(slug)}
              >
                {index?.getMaterial(slug)?.name ?? slug}
              </Button>
            ))}
          </div>
          <p className="type-caption showcase-note">
            Destaque e recuo só existem na visão "Selecionado". Os grupos internos (nível 2) só
            aparecem para o material escolhido. Nomes em inglês são materiais fora do catálogo: só
            existem no desenho.
          </p>
        </section>
      </div>

      <div className="objects-column">
        <div className="objects-frame" data-testid="object-main">
          <ObjectDrawing
            file={object.svg}
            label={object.name}
            view={view}
            material={material}
            {...(view === 'universe' ? { size: UNIVERSE_SIZE[object.plane] } : {})}
          />
        </div>
        <p className="type-caption showcase-caption">
          {object.name} · plano {object.plane} · caixa de 640 x 480
        </p>

        <section data-testid="object-audit">
          <h2 className="type-overline showcase-heading">Auditoria · {object.svg}</h2>
          <p className="type-body">
            {summary.errors} {summary.errors === 1 ? 'erro' : 'erros'} · {summary.warnings}{' '}
            {summary.warnings === 1 ? 'aviso' : 'avisos'}
          </p>
          <ul className="content-codes">
            {summary.byCode.map(([code, count, severity]) => (
              <li key={code} className="type-data" data-severity={severity}>
                {count} x {code}
              </li>
            ))}
          </ul>
          <ul className="content-layers">
            {levels.map((level) => (
              <li key={level.id} className="type-data">
                {level.id} · {level.groups} · {level.shapes} formas
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="objects-column">
        <h2 className="type-overline showcase-heading">Tamanhos de revisão · nível 0</h2>
        <div className="objects-sizes">
          {([340, 260, 200, THUMBNAIL_SIZE] as const).map((size) => (
            <div className="showcase-cell" key={size}>
              <ObjectDrawing
                file={object.svg}
                label={`${object.name}, ${size} px`}
                view={size === THUMBNAIL_SIZE ? 'thumbnail' : 'universe'}
                size={size}
              />
              <span className="type-data showcase-caption">{size} px</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
