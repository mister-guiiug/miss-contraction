/**
 * Utilitaires de sécurité pour tous les projets
 */

/**
 * Sanitizer basique pour les entrées utilisateur HTML
 */
export function sanitizeHtml(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Échapper les caractères spéciaux pour les regex
 */
export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Valider et nettoyer les entrées utilisateur
 */
export function sanitizeInput(input: string, maxLength = 1000): string {
  if (typeof input !== 'string') return '';
  return sanitizeHtml(input.trim().slice(0, maxLength));
}

/**
 * Générer un identifiant sécurisé aléatoire
 */
export function generateSecureId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hasher une chaîne avec SHA-256 (async)
 */
export async function hashString(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Valider qu'une URL est sécurisée (HTTPS)
 */
export function isValidHttpsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Extraire le domaine d'une email de façon sécurisée
 */
export function extractDomainFromEmail(email: string): string | null {
  if (!isValidEmail(email)) return null;
  const parts = email.toLowerCase().split('@');
  return parts[1] || null;
}

/**
 * Valider un email basique
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Masquer partiellement un email pour l'affichage
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;

  const maskedLocal =
    local.length > 2
      ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
      : '*'.repeat(local.length);

  return `${maskedLocal}@${domain}`;
}

/**
 * Masquer partiellement un téléphone pour l'affichage
 */
export function maskPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return phone;

  const visible = cleaned.slice(-2);
  const masked = '*'.repeat(Math.max(0, cleaned.length - 2));
  return masked + visible;
}

/**
 * Rate limiter simple en mémoire
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  canMakeRequest(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];

    // Nettoyer les anciennes requêtes
    const validRequests = requests.filter(time => now - time < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }

  reset(identifier: string): void {
    this.requests.delete(identifier);
  }
}

/**
 * Détecter si une requête vient d'un bot (basique)
 */
export function isBotRequest(userAgent: string): boolean {
  const botPatterns = [
    /bot/i,
    /spider/i,
    /crawl/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
  ];

  return botPatterns.some(pattern => pattern.test(userAgent));
}
