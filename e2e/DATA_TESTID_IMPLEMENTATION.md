# Guide d'implémentation des data-testid

Ce document liste tous les `data-testid` à ajouter aux composants React pour supporter les tests E2E robustes.

## HomeView

### Boutons principaux
```tsx
// src/react/components/home/TimerSectionWithIntensity.tsx
<button data-testid="start-contraction-btn">Début</button>
<button data-testid="stop-contraction-btn">Fin</button>
```

### Affichage Timer
```tsx
// src/react/components/home/TimerSectionWithIntensity.tsx
<span data-testid="timer-display">{formatted}</span>
<div data-testid="contraction-active" style={{opacity: isRunning ? 1 : 0.5}} />
```

### Intensité
```tsx
// src/react/components/home/IntensityPicker.tsx
<button data-testid="intensity-1" aria-pressed={intensity === 1}>1</button>
<button data-testid="intensity-2" aria-pressed={intensity === 2}>2</button>
<button data-testid="intensity-3" aria-pressed={intensity === 3}>3</button>
<button data-testid="intensity-4" aria-pressed={intensity === 4}>4</button>
<button data-testid="intensity-5" aria-pressed={intensity === 5}>5</button>
```

### Badge Seuil
```tsx
// src/react/components/home/ThresholdBadge.tsx
<div 
  data-testid="threshold-badge" 
  data-state={state}
>
  {icon}{message}
</div>
```

### Notes Rapides
```tsx
// src/react/components/home/QuickNotes.tsx
<button 
  data-testid="quick-note" 
  data-note="Contraction forte"
  onClick={() => onNoteSelect('Contraction forte')}
>
  Contraction forte
</button>
```

### Stats
```tsx
// src/react/components/home/StatsSection.tsx
<section data-testid="stats-section">
  <div class="stat-card">
    <span data-stat="qty">{data.qtyPerHour}</span>
  </div>
  <div class="stat-card">
    <span data-stat="duration">{data.avgDuration}</span>
  </div>
  <div class="stat-card">
    <span data-stat="frequency">{data.avgFrequency}</span>
  </div>
</section>
```

### Fenêtre temporelle
```tsx
// src/react/components/home/StatsSection.tsx
<button data-testid="time-window-30">30 min</button>
<button data-testid="time-window-60">60 min</button>
<button data-testid="time-window-120">120 min</button>
<button data-testid="time-window-all">Toutes</button>
```

### Historique
```tsx
// src/react/components/home/HistoryList.tsx
<div data-testid="history-list">
  <div data-testid="contraction-entry" key={record.id}>
    {/* contenu */}
  </div>
</div>

<button data-testid="undo-btn">Annuler</button>
```

### État vide
```tsx
// src/react/components/home/EmptyState.tsx
<div data-testid="empty-state">
  Pas encore de contractions enregistrées
</div>
```

### Vue principale
```tsx
// src/react/views/HomeView.tsx
<div id="view-home" data-testid="view-home">
```

---

## SettingsView

### Inputs Seuils
```tsx
// src/react/views/SettingsView.tsx
<input 
  data-testid="max-interval-input"
  name="maxIntervalMin" 
  type="number" 
/>
<input 
  data-testid="min-duration-input"
  name="minDurationSec" 
  type="number" 
/>
<input 
  data-testid="consecutive-count-input"
  name="consecutiveCount" 
  type="number" 
/>
```

### Inputs Maternité
```tsx
<input 
  data-testid="maternity-name-input"
  name="maternityLabel" 
  type="text" 
/>
<input 
  data-testid="maternity-phone-input"
  name="maternityPhone" 
  type="tel" 
/>
<input 
  data-testid="maternity-address-input"
  name="maternityAddress" 
  type="text" 
/>
```

### Toggles
```tsx
<input 
  data-testid="theme-toggle"
  name="theme" 
  type="checkbox" 
/>
<input 
  data-testid="high-contrast-toggle"
  name="highContrast" 
  type="checkbox" 
/>
<input 
  data-testid="large-mode-toggle"
  name="largeMode" 
  type="checkbox" 
/>
<input 
  data-testid="vibration-toggle"
  name="hapticFeedback" 
  type="checkbox" 
/>
<input 
  data-testid="voice-commands-toggle"
  name="voiceCommands" 
  type="checkbox" 
/>
```

### Snooze
```tsx
<button data-testid="snooze-30-btn">Snooze 30 min</button>
<button data-testid="snooze-60-btn">Snooze 1h</button>
<button data-testid="cancel-snooze-btn">Annuler Snooze</button>
```

### Notification
```tsx
<button data-testid="request-notification-btn">Activer notifications</button>
```

### Actions
```tsx
<button data-testid="save-settings-btn">Enregistrer</button>
<button data-testid="clear-data-btn">Effacer toutes les données</button>
<div data-testid="save-confirmation">Paramètres enregistrés !</div>
```

### Vue
```tsx
<div data-testid="view-settings">
```

---

## TableView

### Tableau
```tsx
// src/react/views/TableView.tsx
<table data-testid="contractions-table">
  <thead>
    <tr>
      <th data-testid="header-time">Heure</th>
      <th data-testid="header-duration">Durée</th>
      <th data-testid="header-interval">Intervalle</th>
      <th data-testid="header-frequency">Fréquence</th>
      <th data-testid="header-note">Note</th>
    </tr>
  </thead>
  <tbody>
    <tr data-testid="contraction-table-row">
      <td data-col="time">{time}</td>
      <td data-col="duration">{duration}</td>
      <td data-col="interval">{interval}</td>
      <td data-col="frequency">{frequency}</td>
      <td data-col="note">{note}</td>
      <td>
        <button data-testid="edit-btn">Éditer</button>
        <button data-testid="delete-btn">Supprimer</button>
      </td>
    </tr>
  </tbody>
</table>
```

### Modale Édition
```tsx
<div data-testid="edit-contraction-modal" role="dialog">
  <input data-testid="contraction-note-input" />
  <button data-testid="modal-save-btn">Enregistrer</button>
  <button data-testid="modal-cancel-btn">Annuler</button>
</div>
```

### Message Vide
```tsx
<div data-testid="empty-table-message">
  Pas de contractions enregistrées
</div>
```

### Export
```tsx
<button data-testid="export-btn">Exporter</button>
```

### Vue
```tsx
<div data-testid="view-table">
```

---

## MaternityView

### Affichage Infos
```tsx
// src/react/views/MaternityView.tsx
<div data-testid="maternity-name">{maternityLabel}</div>
<a 
  data-testid="maternity-phone-link"
  href={`tel:${phone}`}
>
  {phone}
</a>
<div data-testid="maternity-address">{address}</div>
<div data-testid="maternity-instructions">{instructions}</div>
```

### Boutons Action
```tsx
<a 
  data-testid="maternity-phone-link"
  href={`tel:...`}
>
  Appeler
</a>
<a 
  data-testid="maternity-directions-link"
  href="https://www.google.com/maps/..."
>
  Itinéraire
</a>
```

### Vue
```tsx
<div data-testid="view-maternity">
```

---

## MessageView

### Textarea
```tsx
// src/react/views/MessageView.tsx
<textarea 
  data-testid="message-textarea"
  value={message}
  onChange={(e) => setMessage(e.target.value)}
/>
```

### Boutons Partage
```tsx
<button data-testid="copy-message-btn">Copier</button>
<a 
  data-testid="share-whatsapp-link"
  href={`https://wa.me/?text=...`}
>
  Partager WhatsApp
</a>
<a 
  data-testid="share-sms-link"
  href={`sms:?body=...`}
>
  Partager SMS
</a>
```

### Confirmation
```tsx
<div data-testid="copy-confirmation">Copié !</div>
```

### Vue
```tsx
<div data-testid="view-message">
```

---

## Navigation & Shell

### Navigation
```tsx
// src/react/components/layout/BottomNav.tsx
<nav data-testid="main-navigation">
  <a data-testid="nav-home" href="/">Accueil</a>
  <a data-testid="nav-settings" href="/parametres">Paramètres</a>
  <a data-testid="nav-table" href="/historique">Historique</a>
  <a data-testid="nav-maternity" href="/maternite">Maternité</a>
  <a data-testid="nav-message" href="/message">Message</a>
</nav>
```

---

## Éléments Volatiles

Pour les snapshots visuels, marquer les éléments qui changent constamment:

```tsx
<span data-testid="volatile" data-volatile>
  {/* Éléments qui changent: timer, minuteur, etc. */}
</span>
```

---

## Ordre d'implémentation recommandé

1. **Phase 1** (Critique):
   - `start-contraction-btn`
   - `stop-contraction-btn`
   - `threshold-badge`
   - `view-home`, `view-settings`, `view-table`

2. **Phase 2** (Important):
   - Tous les `max-interval-input`, `min-duration-input`, etc.
   - `stats-section`
   - Navigation links

3. **Phase 3** (Support):
   - Toggles
   - Modales
   - Messages vides

4. **Phase 4** (Accessibilité):
   - `data-col` pour tableau
   - `data-state` pour badge
   - `data-volatile` pour snapshots

---

## Exemple complet pour une fonction

```tsx
// Avant
export function StartButton({ onClick }) {
  return (
    <button className="start-btn" onClick={onClick}>
      Début
    </button>
  );
}

// Après
export function StartButton({ onClick }) {
  return (
    <button 
      className="start-btn" 
      data-testid="start-contraction-btn"
      aria-label="Démarrer une contraction"
      onClick={onClick}
    >
      Début
    </button>
  );
}
```

---

**Astuce**: Les data-testid ne doivent pas être supprimés lors de refactorisations CSS/design. Ils représentent l'API de test.
