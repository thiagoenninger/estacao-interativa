import { useState } from 'react';
import { Button } from '../../design-system/buttons/Button';
import { BackgroundTab } from './BackgroundTab';
import { ButtonsTab } from './ButtonsTab';
import { ColorsTab } from './ColorsTab';
import { ContentTab } from './ContentTab';
import { IconsTab } from './IconsTab';
import { ObjectsTab } from './ObjectsTab';
import { PlatformTab } from './PlatformTab';
import { SpaceShapeTab } from './SpaceShapeTab';
import { TypographyTab } from './TypographyTab';
import './showcase.css';

const TABS = [
  ['colors', 'Cores', ColorsTab],
  ['typography', 'Tipografia', TypographyTab],
  ['space-shape', 'Espaço e forma', SpaceShapeTab],
  ['background', 'Fundo', BackgroundTab],
  ['icons', 'Ícones', IconsTab],
  ['buttons', 'Botões', ButtonsTab],
  ['content', 'Conteúdo', ContentTab],
  ['objects', 'Objetos', ObjectsTab],
  ['platform', 'Plataforma', PlatformTab],
] as const;

type TabId = (typeof TABS)[number][0];

export function Showcase() {
  const [active, setActive] = useState<TabId>('colors');
  const Content = TABS.find(([id]) => id === active)?.[2] ?? ColorsTab;

  return (
    <div className="showcase" data-testid="showcase">
      <div className="showcase-tabs" role="tablist">
        {TABS.map(([id, label]) => (
          <Button
            key={id}
            role="tab"
            aria-selected={id === active}
            variant={id === active ? 'primary' : 'secondary'}
            onPress={() => setActive(id)}
          >
            {label}
          </Button>
        ))}
      </div>
      <div className="showcase-content" role="tabpanel" data-testid={`showcase-tab-${active}`}>
        <Content />
      </div>
    </div>
  );
}
