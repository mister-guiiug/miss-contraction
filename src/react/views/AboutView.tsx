import { useState } from 'react';
import { ViewLayout } from '../components/layout/ViewLayout';
import { forceSwUpdate } from '../../register-sw';
import { useAppStore } from '../store/useAppStore';
import { t } from '../../i18n';

const REPO_URL = 'https://github.com/mister-guiiug/miss-contraction';
const COFFEE_URL = 'https://buymeacoffee.com/mister.guiiug';
const APP_VERSION = __APP_VERSION__;

function IconRefresh({ spinning }: { spinning: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={spinning ? 'about-icon-spin' : ''}
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function IconCoffee() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" x2="6" y1="2" y2="4" />
      <line x1="10" x2="10" y1="2" y2="4" />
      <line x1="14" x2="14" y1="2" y2="4" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0, marginTop: '0.1em' }}
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" x2="12" y1="9" y2="13" />
      <line x1="12" x2="12.01" y1="17" y2="17" />
    </svg>
  );
}

function IconExternalLink() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17 17 7M7 7h10v10" />
    </svg>
  );
}

export function AboutView() {
  const [reloading, setReloading] = useState(false);
  const language = useAppStore(state => state.settings.language);

  function handleForceReload() {
    setReloading(true);
    // Try SW update first; fall back to hard reload after 1 s.
    forceSwUpdate();
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  return (
    <ViewLayout
      title={t(language, 'about.title')}
      lead={t(language, 'about.lead')}
      dataTestId="about-view"
    >
      <div className="about-view">
        {/* Hero */}
        <div className="about-hero">
          <div className="about-hero__logo" aria-hidden="true">
            <svg
              viewBox="0 0 48 48"
              width="48"
              height="48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="24"
                cy="24"
                r="22"
                fill="rgba(var(--accent-rgb),0.12)"
                stroke="rgba(var(--accent-rgb),0.35)"
                strokeWidth="1.5"
              />
              <path
                d="M24 14c-4.418 0-8 3.582-8 8 0 3.16 1.84 5.908 4.517 7.271L19 34h10l-1.517-4.729C30.16 27.908 32 25.16 32 22c0-4.418-3.582-8-8-8z"
                fill="rgba(var(--accent-rgb),0.7)"
              />
              <rect
                x="19"
                y="34"
                width="10"
                height="2"
                rx="1"
                fill="rgba(var(--accent-rgb),0.5)"
              />
              <rect
                x="20.5"
                y="37"
                width="7"
                height="2"
                rx="1"
                fill="rgba(var(--accent-rgb),0.35)"
              />
            </svg>
          </div>
          <div className="about-hero__body">
            <span className="about-hero__name">Miss Contraction</span>
            <span className="about-hero__version">v{APP_VERSION}</span>
          </div>
        </div>

        {/* Story / Histoire */}
        <section className="about-section" aria-labelledby="about-story-lbl">
          <h3 id="about-story-lbl" className="about-section__title">
            {t(language, 'about.storyTitle')}
          </h3>
          <div className="about-section__text" style={{ lineHeight: 1.6 }}>
            <p>{t(language, 'about.storyIntro')}</p>
            <p>{t(language, 'about.storySisterPregnancy')}</p>
            <p>{t(language, 'about.storyProblem')}</p>
            <p>{t(language, 'about.storyNeeds')}</p>
            <p>
              <strong>{t(language, 'about.storySolution')}</strong>
            </p>
            <ul style={{ margin: '0.5em 0 0.5em 1.2em', paddingLeft: 0 }}>
              <li>{t(language, 'about.storyFeatures1')}</li>
              <li>{t(language, 'about.storyFeatures2')}</li>
              <li>{t(language, 'about.storyFeatures3')}</li>
            </ul>
            <p>{t(language, 'about.storyEssence')}</p>
            <p>
              {language === 'fr'
                ? 'Si vous aimez ce projet et souhaitez le soutenir, vous pouvez m\'offrir un café via'
                : 'If you like this project and want to support it, you can buy me a coffee via'}{' '}
              <a href={COFFEE_URL} target="_blank" rel="noopener noreferrer">
                {COFFEE_URL}
              </a>
            </p>
          </div>
        </section>

        {/* Version */}
        <section className="about-section" aria-labelledby="about-version-lbl">
          <h3 id="about-version-lbl" className="about-section__title">
            {t(language, 'about.versionDeployed')}
          </h3>
          <p className="about-version">
            <span className="about-version__tag">v{APP_VERSION}</span>
            <span className="about-version__note">
              {t(language, 'about.hostedOn')}
              <a
                href="https://mister-guiiug.github.io/miss-contraction/"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub Pages
              </a>
            </span>
          </p>
        </section>

        {/* Code source */}
        <section className="about-section" aria-labelledby="about-source-lbl">
          <h3 id="about-source-lbl" className="about-section__title">
            {t(language, 'about.sourceTitle')}
          </h3>
          <p className="about-section__text">
            {t(language, 'about.sourceText')}
          </p>
          <a
            className="about-link-card"
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Voir le code source sur GitHub (nouvel onglet)"
          >
            <span className="about-link-card__icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="currentColor"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </span>
            <span className="about-link-card__body">
              <span className="about-link-card__title">
                mister-guiiug / miss-contraction
              </span>
              <span className="about-link-card__sub">github.com</span>
            </span>
            <span className="about-link-card__arrow" aria-hidden="true">
              <IconExternalLink />
            </span>
          </a>
        </section>

        {/* Soutien */}
        <section className="about-section" aria-labelledby="about-support-lbl">
          <h3 id="about-support-lbl" className="about-section__title">
            {t(language, 'about.supportTitle')}
          </h3>
          <a
            className="about-link-card about-link-card--coffee"
            href={COFFEE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Buy me a coffee (nouvel onglet)"
          >
            <span className="about-link-card__icon" aria-hidden="true">
              <IconCoffee />
            </span>
            <span className="about-link-card__body">
              <span className="about-link-card__title">Buy me a coffee</span>
              <span className="about-link-card__sub">buymeacoffee.com</span>
            </span>
            <span className="about-link-card__arrow" aria-hidden="true">
              <IconExternalLink />
            </span>
          </a>
        </section>

        {/* PWA */}
        <section className="about-section" aria-labelledby="about-pwa-lbl">
          <h3 id="about-pwa-lbl" className="about-section__title">
            {t(language, 'about.pwaTitle')}
          </h3>
          <p className="about-section__text">{t(language, 'about.pwaText')}</p>
          <button
            type="button"
            className="btn btn-secondary about-reload-btn"
            onClick={handleForceReload}
            disabled={reloading}
            aria-busy={reloading}
          >
            <IconRefresh spinning={reloading} />
            {reloading
              ? t(language, 'about.reloading')
              : t(language, 'about.forceReload')}
          </button>
        </section>

        {/* Avertissement */}
        <p className="about-disclaimer">
          <IconAlert />
          {t(language, 'about.disclaimer')}
        </p>
      </div>
    </ViewLayout>
  );
}
