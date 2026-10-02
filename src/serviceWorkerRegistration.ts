// Registers the service worker in production builds, so the app works
// offline and can be installed. Nothing is registered during development
// (`npm start`), where it would serve stale files.
export const registerServiceWorker = (
  onUpdate?: (registration: ServiceWorkerRegistration) => void
) => {
  if (
    process.env.NODE_ENV !== 'production' ||
    typeof navigator === 'undefined' ||
    !('serviceWorker' in navigator)
  ) {
    return;
  }
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${process.env.PUBLIC_URL}/service-worker.js`)
      .then((registration) => {
        registration.onupdatefound = () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.onstatechange = () => {
            // A new version is ready while an old one is still in use.
            if (
              worker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              onUpdate?.(registration);
            }
          };
        };
      })
      .catch(() => {
        // Without it the app still works; it just needs the network.
      });
  });
};
