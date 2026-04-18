/**
 * Monitoring des Web Vitals pour vanilla JS
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}

interface Metric {
  name: string
  value: number
  id: string
  navigationType?: string
}

interface MetricWithRating extends Metric {
  rating: 'good' | 'needs-improvement' | 'poor'
}

/**
 * Obtenir la note de performance d'une métrique
 */
function getRating(metric: Metric): 'good' | 'needs-improvement' | 'poor' {
  switch (metric.name) {
    case 'CLS':
      if (metric.value <= 0.1) return 'good'
      if (metric.value <= 0.25) return 'needs-improvement'
      return 'poor'
    case 'FID':
      if (metric.value <= 100) return 'good'
      if (metric.value <= 300) return 'needs-improvement'
      return 'poor'
    case 'FCP':
      if (metric.value <= 1800) return 'good'
      if (metric.value <= 3000) return 'needs-improvement'
      return 'poor'
    case 'LCP':
      if (metric.value <= 2500) return 'good'
      if (metric.value <= 4000) return 'needs-improvement'
      return 'poor'
    case 'TTFB':
      if (metric.value <= 800) return 'good'
      if (metric.value <= 1800) return 'needs-improvement'
      return 'poor'
    default:
      return 'poor'
  }
}

/**
 * Logger pour les Web Vitals
 */
function logMetric(metric: MetricWithRating): void {
  const metricWithRating = { ...metric, rating: getRating(metric) }

  // Console logging en développement
  if (import.meta.env.DEV) {
    console.log('[Web Vitals]', metricWithRating)
  }

  // Envoyer à Google Analytics
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
      custom_map: { metric_rating: metricWithRating.rating },
    })
  }
}

/**
 * Initialiser le monitoring des Web Vitals
 */
export async function initWebVitals(): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    const { onCLS, onFID, onFCP, onLCP, onTTFB } = await import('web-vitals')

    onCLS(logMetric)
    onFID(logMetric)
    onFCP(logMetric)
    onLCP(logMetric)
    onTTFB(logMetric)
  } catch (error) {
    console.warn('Failed to initialize Web Vitals:', error)
  }
}
