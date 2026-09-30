import { useState } from 'react';
import { Button } from '../../design-system/buttons/Button';
import { IconButton } from '../../design-system/buttons/IconButton';
import { BackButton, HomeButton } from '../../design-system/buttons/NavigationButtons';

function Cell({ caption, children }: { caption: string; children: React.ReactNode }) {
  return (
    <div className="showcase-cell">
      {children}
      <span className="type-overline showcase-caption">{caption}</span>
    </div>
  );
}

export function ButtonsTab() {
  const [presses, setPresses] = useState(0);

  return (
    <>
      <section className="showcase-section">
        <h2 className="type-overline showcase-heading">Back Button e Home Button</h2>
        <div className="showcase-row">
          <Cell caption="Back · default">
            <BackButton />
          </Cell>
          <Cell caption="Back · pressed">
            <BackButton pressed />
          </Cell>
          <Cell caption="Back · disabled">
            <BackButton disabled />
          </Cell>
          <Cell caption="Home · default">
            <HomeButton />
          </Cell>
          <Cell caption="Home · pressed">
            <HomeButton pressed />
          </Cell>
          <Cell caption="Home · disabled">
            <HomeButton disabled />
          </Cell>
        </div>
      </section>
      <section className="showcase-section">
        <h2 className="type-overline showcase-heading">Interactive Button</h2>
        <div className="showcase-row">
          <Cell caption="Primário">
            <Button icon="connections">Ver outros objetos</Button>
          </Cell>
          <Cell caption="Secundário">
            <Button variant="secondary" icon="next">
              Próximo
            </Button>
          </Cell>
          <Cell caption="Só texto">
            <Button>Continuar</Button>
          </Cell>
          <Cell caption="Pressed">
            <Button icon="connections" pressed>
              Ver outros objetos
            </Button>
          </Cell>
          <Cell caption="Disabled">
            <Button icon="connections" disabled>
              Ver outros objetos
            </Button>
          </Cell>
        </div>
      </section>
      <section className="showcase-section">
        <h2 className="type-overline showcase-heading">Icon Button</h2>
        <div className="showcase-row">
          <Cell caption="Default">
            <IconButton icon="close" label="Fechar" />
          </Cell>
          <Cell caption="Pressed">
            <IconButton icon="close" label="Fechar" pressed />
          </Cell>
          <Cell caption="Disabled">
            <IconButton icon="close" label="Fechar" disabled />
          </Cell>
          <Cell caption="Informação">
            <IconButton icon="info" label="Informação" />
          </Cell>
          <Cell caption="Som (futuro)">
            <IconButton icon="sound" label="Som" />
          </Cell>
          <Cell caption="Acessibilidade (futuro)">
            <IconButton icon="accessibility" label="Acessibilidade" />
          </Cell>
        </div>
      </section>
      <section className="showcase-section">
        <h2 className="type-overline showcase-heading">Teste de toque</h2>
        <div className="showcase-row">
          <Button icon="touch" onPress={() => setPresses((count) => count + 1)}>
            Tocar aqui
          </Button>
          <span className="type-body" data-testid="press-counter">
            Toques registrados: {presses}
          </span>
        </div>
        <p className="type-caption showcase-note">
          O botão fica pressionado assim que o dedo encosta. A ação só conta ao soltar dentro do
          botão; arrastar para fora cancela.
        </p>
      </section>
    </>
  );
}
