import { Link } from 'react-router-dom';
/**
 * Vue Message - Modèle de SMS/WhatsApp pour la maternité
 */

import { useEffect, useState, useCallback } from 'react';
import { ViewLayout } from '../components/layout/ViewLayout';
import { useAppStore } from '../store/useAppStore';
import { t } from '../../i18n';

const MATERNITY_MESSAGE_STORAGE_KEY = 'mc_maternity_message_v1';

const DEFAULT_MATERNITY_MESSAGE =
  'Coucou,\n\n' +
  "C'est le grand jour pour nous : je pars à la maternité. Les contractions se suivent bien, et c'est cohérent avec ce qu'on s'était dit avec la sage-femme.\n\n" +
  "J'ai un peu les papillons, mais je me sens prête. Pense fort à nous — je t'envoie des nouvelles dès que je peux.\n\n" +
  "Je t'embrasse";

function loadMaternityMessageDraft(): string {
  try {
    const s = localStorage.getItem(MATERNITY_MESSAGE_STORAGE_KEY);
    if (s != null && s.trim() !== '') return s;
  } catch {
    /* ignore */
  }
  return DEFAULT_MATERNITY_MESSAGE;
}

function persistMaternityMessage(text: string): void {
  try {
    localStorage.setItem(MATERNITY_MESSAGE_STORAGE_KEY, text);
  } catch {
    /* ignore quota */
  }
}

export function MessageView() {
  const language = useAppStore(state => state.settings.language);
  const [message, setMessage] = useState(loadMaternityMessageDraft);
  const [feedback, setFeedback] = useState('');

  // Sauvegarder automatiquement quand le message change (debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      persistMaternityMessage(message);
    }, 400);
    return () => clearTimeout(timer);
  }, [message]);

  // Réinitialiser au message par défaut
  const handleReset = useCallback(() => {
    setMessage(DEFAULT_MATERNITY_MESSAGE);
    persistMaternityMessage(DEFAULT_MATERNITY_MESSAGE);
    setFeedback(t(language, 'message.feedback.defaultRestored'));
    setTimeout(() => setFeedback(''), 3000);
  }, [language]);

  // Copier dans le presse-papiers
  const handleCopy = useCallback(async () => {
    if (!message.trim()) {
      setFeedback(t(language, 'message.feedback.empty'));
      setTimeout(() => setFeedback(''), 3000);
      return;
    }
    try {
      await navigator.clipboard.writeText(message);
      setFeedback(t(language, 'message.feedback.copied'));
      setTimeout(() => setFeedback(''), 3000);
    } catch {
      setFeedback(t(language, 'message.feedback.copyError'));
      setTimeout(() => setFeedback(''), 3000);
    }
  }, [language, message]);

  // Ouvrir WhatsApp
  const handleWhatsApp = useCallback(() => {
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [message]);

  // Ouvrir SMS
  const handleSms = useCallback(() => {
    const url = `sms:?body=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }, [message]);

  useEffect(() => {
    document.title = 'Message maternité - Miss Contraction';
  }, []);

  return (
    <ViewLayout
      className="message-page"
      dataTestId="message-view"
      title={t(language, 'message.title')}
      lead={t(language, 'message.lead')}
    >
      <section
        className="card"
        aria-labelledby="message-heading"
        data-testid="message-section"
      >
        <h2 id="message-heading" className="section-title">
          {t(language, 'message.yourMessage')}
        </h2>

        <label className="field">
          <span>{t(language, 'message.customize')}</span>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="msg-textarea"
            data-testid="message-textarea"
            rows={10}
            spellCheck="true"
            autoComplete="off"
            aria-describedby="msg-hint-block"
          />
        </label>

        {feedback && (
          <p
            className="msg-feedback"
            role="status"
            aria-live="polite"
            data-testid="message-feedback"
          >
            {feedback}
          </p>
        )}

        <div
          className="msg-actions"
          role="group"
          aria-label={t(language, 'message.groupAria')}
        >
          <button
            type="button"
            className="btn btn-secondary"
            data-testid="message-reset-btn"
            onClick={handleReset}
          >
            {t(language, 'message.reset')}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            data-testid="message-copy-btn"
            onClick={handleCopy}
          >
            {t(language, 'message.copy')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            data-testid="message-whatsapp-btn"
            onClick={handleWhatsApp}
          >
            {t(language, 'message.whatsapp')}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            data-testid="message-sms-btn"
            onClick={handleSms}
          >
            {t(language, 'message.sms')}
          </button>
        </div>

        <p className="msg-hint" id="msg-hint-block">
          {t(language, 'message.hint')}
        </p>
      </section>

      <p className="settings-back-wrap mobile-home-only">
        <Link
          to="/"
          className="btn btn-secondary settings-back-link"
          data-testid="message-back-link"
        >
          {t(language, 'message.backHome')}
        </Link>
      </p>
    </ViewLayout>
  );
}
