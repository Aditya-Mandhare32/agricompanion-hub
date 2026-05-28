// Lightweight Web Push / Notifications helper (local notifications only).
// Remote push (VAPID + pushManager.subscribe) is intentionally NOT wired up.

const isPreviewHost = () =>
  typeof window !== 'undefined' &&
  (window.location.hostname.includes('id-preview--') ||
    window.location.hostname.includes('lovableproject.com') ||
    window.location.hostname.includes('lovable.app'));

const isInIframe = () => {
  try {
    return typeof window !== 'undefined' && window.self !== window.top;
  } catch {
    return true;
  }
};

export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

export function getPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;
  // Skip in preview/iframe to avoid stale caches in the Lovable editor.
  if (isInIframe() || isPreviewHost()) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      regs.forEach((r) => r.unregister());
    } catch {}
    return null;
  }
  try {
    return await navigator.serviceWorker.register('/sw.js');
  } catch (err) {
    console.warn('SW registration failed:', err);
    return null;
  }
}

export async function requestPushPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isPushSupported()) return 'unsupported';
  if (Notification.permission === 'granted') {
    await showLocalNotification('Agri360', 'Notifications are already enabled ✅');
    return 'granted';
  }
  if (Notification.permission === 'denied') return 'denied';
  const perm = await Notification.requestPermission();
  if (perm === 'granted') {
    await registerServiceWorker();
    await showLocalNotification('Welcome to Agri360 🌱', 'You\'ll receive farm task reminders and weather alerts.');
  }
  return perm;
}

export async function showLocalNotification(title: string, body: string, url = '/dashboard'): Promise<void> {
  if (!isPushSupported() || Notification.permission !== 'granted') return;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      await reg.showNotification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: { url },
      });
    } else {
      new Notification(title, { body, icon: '/icon-192.png' });
    }
  } catch (err) {
    console.warn('showLocalNotification failed:', err);
  }
}
