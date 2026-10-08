import { useEffect, useState } from 'react';
import { calculateScale } from '../../app/stage/scale';
import { useWindowSize } from '../../app/stage/useWindowSize';
import { getStation } from '../../platform/station';
import type { StationInfo } from '../../platform/station-info';

const number = (value: number, digits: number) =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const size = (width: number, height: number) => `${Math.round(width)} × ${Math.round(height)}`;

/**
 * Shows where the page is running (ordinary browser or the Electron shell) and the numbers that
 * decide how big the Stage is on the real screen. Development tool only.
 */

export function PlatformTab() {
  const station = getStation();
  const { width, height } = useWindowSize();
  const [info, setInfo] = useState<StationInfo | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!station) return;
    let alive = true;
    station.getInfo().then(
      (value) => {
        if (!alive) return;
        setInfo(value);
        setFailed(false);
      },
      () => {
        if (alive) setFailed(true);
      },
    );
    return () => {
      alive = false;
    };
  }, [station, width, height]);

  const pixelRatio = window.devicePixelRatio || 1;
  const stageScale = calculateScale(width, height).factor;

  const facts: [string, string, string][] = [
    ['shell', 'Casa', station ? 'Electron' : 'Navegador comum (sem a casca Electron)'],
  ];
  if (info) {
    facts.push(
      [
        'versions',
        'Versões',
        `Electron ${info.versions.electron} · Chromium ${info.versions.chrome} · Node ${info.versions.node}`,
      ],
      ['mode', 'Modo', info.mode === 'development' ? 'desenvolvimento' : 'produção'],
      ['kiosk', 'Quiosque', info.kiosk ? 'sim (tela cheia, sem cursor)' : 'não (janela comum)'],
      ['display', 'Tela (px lógicos do Windows)', size(info.display.width, info.display.height)],
      ['windows-scale', 'Escala do Windows', `${Math.round(info.display.scaleFactor * 100)}%`],
      ['zoom', 'Zoom aplicado pela casca', number(info.zoomFactor, 3)],
    );
  }
  facts.push(
    ['window', 'Janela (px CSS)', size(width, height)],
    ['pixel-ratio', 'Pixels físicos por px CSS', number(pixelRatio, 3)],
    ['physical', 'Janela (pixels físicos)', size(width * pixelRatio, height * pixelRatio)],
    ['stage-scale', 'Escala do Palco', number(stageScale, 3)],
  );

  return (
    <div className="platform-tab" data-testid="platform-tab">
      <h2 className="type-overline showcase-heading">Plataforma</h2>
      <dl className="platform-facts" data-testid="platform-facts">
        {facts.map(([id, label, value]) => (
          <div className="platform-fact" key={id}>
            <dt className="type-data showcase-caption">{label}</dt>
            <dd className="type-body" data-testid={`platform-fact-${id}`}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
      {failed && (
        <p className="type-body" data-testid="platform-error">
          A casca não respondeu.
        </p>
      )}
      <p className="type-caption showcase-note">
        Em tela cheia, em uma tela 16:9, a janela mede 1920 x 1080 px CSS e a escala do Palco é
        1,000: o zoom da casca faz todo o ajuste.
      </p>
    </div>
  );
}
