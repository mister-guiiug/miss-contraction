import { Link } from 'react-router-dom';
/**
 * Vue Message - Modèle de SMS/WhatsApp pour la maternité
 */

import { useEffect, useState, useCallback } from 'react';

const MATERNITY_MESSAGE_STORAGE_KEY = 'mc_maternity_message_v1';

const DEFAULT_MATERNITY_MESSAGE =
  'Coucou,\n\n' +
  'C\'est le grand jour pour nous : je pars à la maternité. Les contractions se suivent bien, et c\'est cohérent avec ce qu\'on s\'était dit avec la sage-femme.\n\n' +
  'J\'ai un peu les papillons, mais je me sens prête. Pense fort à nous — je t\'envoie des nouvelles dès que je peux.\n\n' +
  'Je t\'embrasse';

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
  const [message, setMessage] = useState(DEFAULT_MATERNITY_MESSAGE);
  const [feedback, setFeedback] = useState('');

  // Charger le message au montage
  useEffect(() => {
    setMessage(loadMaternityMessageDraft());
  }, []);

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
    setFeedback('Modèle par défaut restauré.');
    setTimeout(() => setFeedback(''), 3000);
  }, []);

  // Copier dans le presse-papiers
  const handleCopy = useCallback(async () => {
    if (!message.trim()) {
      setFeedback('Le message est vide.');
      setTimeout(() => setFeedback(''), 3000);
      return;
    }
    try {
      await navigator.clipboard.writeText(message);
      setFeedback('Message copié dans le presse-papiers.');
      setTimeout(() => setFeedback(''), 3000);
    } catch {
      setFeedback('Copie impossible — sélectionnez le texte manuellement.');
      setTimeout(() => setFeedback(''), 3000);
    }
  }, [message]);

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
    <div className="message-page" data-testid="message-view">
      <p className="subtitle message-page-lead">
        Modèle de SMS ou WhatsApp pour prévenir vos proches que vous partez à
        la maternité. Adaptez le texte, puis copiez-le ou ouvrez directement
        une application.
      </p>

      <section className="card" aria-labelledby="message-heading" data-testid="message-section">
        <h2 id="message-heading" className="section-title">
          Votre message
        </h2>

        <label className="field">
          <span>Personnalisez le texte avant envoi</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="msg-textarea"
            data-testid="message-textarea"
            rows={10}
            spellCheck="true"
            autoComplete="off"
            aria-describedby="msg-hint-block"
          />
        </label>

        {feedback && (
          <p className="msg-feedback" role="status" aria-live="polite" data-testid="message-feedback">
            {feedback}
          </p>
        )}

        <div className="msg-actions" role="group" aria-label="Envoyer ou copier le message">
          <button type="button" className="btn btn-secondary" data-testid="message-reset-btn" onClick={handleReset}>
            Réinitialiser le modèle
          </button>
          <button type="button" className="btn btn-secondary" data-testid="message-copy-btn" onClick={handleCopy}>
            Copier
          </button>
          <button type="button" className="btn btn-primary" data-testid="message-whatsapp-btn" onClick={handleWhatsApp}>
            Ouvrir WhatsApp
          </button>
          <button type="button" className="btn btn-secondary" data-testid="message-sms-btn" onClick={handleSms}>
            Ouvrir SMS
          </button>
        </div>

        <p className="msg-hint" id="msg-hint-block">
          WhatsApp et SMS ouvrent l'application par défaut sur téléphone ; sur
          ordinateur, WhatsApp Web peut s'ouvrir dans un nouvel onglet. Si le
          lien SMS échoue (message très long), utilisez « Copier ». Vous pouvez
          aussi coller le texte dans Signal, e-mail, etc.
        </p>
      </section>

      <p className="settings-back-wrap">
        <Link to="/" className="btn btn-secondary settings-back-link" data-testid="message-back-link">
          Retour à l'accueil
        </Link>
      </p>
    </div>
  );
}
