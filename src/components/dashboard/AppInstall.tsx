import React, { useEffect, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';

// Chrome and Edge's install prompt; not yet in TypeScript's DOM types.
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const chip =
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap';

// "Install app" when the browser offers it, and "New version" once an
// update has downloaded in the background.
export const AppInstall: React.FC = () => {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(
    null
  );
  const [update, setUpdate] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      // Keep the browser's own mini-bar from appearing; offer it here.
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => setInstallPrompt(null);
    const onUpdate = (event: Event) =>
      setUpdate((event as CustomEvent<ServiceWorkerRegistration>).detail);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener('financeapp:update-ready', onUpdate);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('financeapp:update-ready', onUpdate);
    };
  }, []);

  if (update) {
    return (
      <button
        onClick={() => {
          const waiting = update.waiting;
          if (waiting) {
            navigator.serviceWorker.addEventListener('controllerchange', () =>
              window.location.reload()
            );
            waiting.postMessage({ type: 'SKIP_WAITING' });
          } else {
            window.location.reload();
          }
        }}
        className={`${chip} bg-blue-50 text-blue-700 hover:bg-blue-100`}
        data-testid="update-ready"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        New version: reload
      </button>
    );
  }

  if (!installPrompt) return null;
  return (
    <button
      onClick={async () => {
        await installPrompt.prompt();
        await installPrompt.userChoice;
        // The prompt can only be used once.
        setInstallPrompt(null);
      }}
      className={`${chip} text-gray-600 hover:bg-gray-100`}
      title="Install FinanceApp in its own window, with a Start menu icon. It works offline."
      data-testid="install-app"
    >
      <Download className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Install app</span>
      <span className="sm:hidden">Install</span>
    </button>
  );
};
