'use client';

export type Placement = 'list' | 'home' | 'popular' | 'organization' | 'email' | 'other';

export interface ClickEvent {
  jobId: string;
  jobSourceId?: string;
  platform: string;
  placement: Placement;
  position?: number;
  query?: string;
  locale: 'tr' | 'en';
}

/**
 * Fire-and-forget click telemetry. sendBeacon survives the tab switch to the external site and
 * never delays navigation; fetch(keepalive) is the fallback.
 */
export function trackJobClick(event: ClickEvent) {
  send('/api/clicks', event);
}

export function trackEvent(name: 'popular_tag_click', data: Record<string, string>) {
  send('/api/events', { name, ...data });
}

function send(url: string, body: object) {
  try {
    const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });
    if (navigator.sendBeacon?.(url, blob)) return;
    void fetch(url, { method: 'POST', body: blob, keepalive: true, headers: { 'content-type': 'application/json' } });
  } catch {
    /* telemetry must never break a click */
  }
}
