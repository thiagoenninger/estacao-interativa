import { Icon } from '../design-system/icons/Icon';
import { UNIVERSE_TEXT } from './texts.ts';
import './universe.css';

export function MainPrompt() {
  return (
    <section className="main-prompt" data-testid="main-prompt">
      <h1 className="main-prompt__title type-display">{UNIVERSE_TEXT.title}</h1>
      <p className="main-prompt__hint type-body-large">
        <span className="main-prompt__icon" data-testid="main-prompt-icon">
          <span className="main-prompt__ring" data-testid="main-prompt-ring" />
          <Icon name="touch" size="lg" />
        </span>
        {UNIVERSE_TEXT.hint}
      </p>
    </section>
  );
}
