/**
 * Service Worker Registration & Background Sync Helper
 */

let swRegistration = null;

export async function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[ServiceWorker] Service Workers are not supported in this browser.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    swRegistration = registration;
    console.log('[ServiceWorker] Service Worker registered successfully with scope:', registration.scope);

    // Listen for incoming messages from the Service Worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SW_SYNC_SUCCESS') {
        console.log('[ServiceWorker Client] Background auto-sync completed:', event.data);
        window.dispatchEvent(new CustomEvent('sw-sync-success', { detail: event.data }));
      }
    });

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[ServiceWorker] New version available.');
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.warn('[ServiceWorker] Registration failed:', error);
    return null;
  }
}

/**
 * Requests the Service Worker to run a background sync if the Background Sync API is supported
 */
export async function triggerBackgroundSync() {
  if (typeof window === 'undefined') return;

  try {
    if (swRegistration && 'sync' in swRegistration) {
      await swRegistration.sync.register('medwaste-auto-sync');
      console.log('[ServiceWorker] Registered background sync tag: "medwaste-auto-sync"');
      return true;
    } else if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      // Fallback: post direct message to service worker
      navigator.serviceWorker.controller.postMessage({ type: 'TRIGGER_SYNC' });
      return true;
    }
  } catch (err) {
    console.warn('[ServiceWorker] Failed to register background sync:', err);
  }
  return false;
}

export function getServiceWorkerRegistration() {
  return swRegistration;
}
