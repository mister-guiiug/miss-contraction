/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /**
   * Identifiant de mesure GA4 (`G-…`), propre à CETTE application. Absent, le
   * bandeau de consentement ne rend rien et rien n'est mesuré : c'est le seul
   * interrupteur, et une propriété par site est ce qui rend le suivi
   * indépendant.
   */
  readonly VITE_GA_MEASUREMENT_ID?: string;
  /**
   * Conteneur GTM (`GTM-…`). Si les DEUX sont posés, le socle ne charge que
   * GTM — GA4 se configure dedans. L'injection au build, retirée le
   * 15/09/2026, chargeait les deux : chaque évènement était compté deux fois.
   */
  readonly VITE_GTM_CONTAINER_ID?: string;
  readonly VITE_SENTRY_DSN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __APP_VERSION__: string;
declare const __APP_BUILD_ID__: string;
declare const __APP_DEPLOYMENT_VERSION__: string;

/** Google Analytics (gtag) — injecté au build par le plugin GTM local. */
interface Window {
  gtag?: (...args: unknown[]) => void;
}

/** Reconnaissance vocale (Chrome / Safari préfixé). */
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onend: (() => void) | null;
}
