import markUrl from '../../../assets/textures/registration-mark.svg';
import './background.css';

const CORNERS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const;

export function Background() {
  return (
    <div className="background" data-testid="background" aria-hidden="true">
      {CORNERS.map((corner) => (
        <img
          key={corner}
          className={`background-mark background-mark--${corner}`}
          src={markUrl}
          alt=""
        />
      ))}
    </div>
  );
}
