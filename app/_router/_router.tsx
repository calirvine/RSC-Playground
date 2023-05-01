// @ts-expect-error Module '"react"' has no exported member 'use'.
import { StrictMode, useEffect, useState, use, startTransition } from 'react';
import { createRoot } from 'react-dom/client';
import { /* FOR FRAMEWORK DEVS */ createFromFetch } from 'react-server-dom-webpack/client';

/** Dev-only dependencies */
import { DevPanel } from '../utils/dev/DevPanel.jsx';
import '../utils/dev/live-reload.js';

// HACK: map webpack resolution to native ESM
// @ts-expect-error Property '__webpack_require__' does not exist on type 'Window & typeof globalThis'.
window.__webpack_require__ = async (id) => {
  return import(id);
};

// @ts-expect-error
const root = createRoot(document.getElementById('root'));
root.render(
  <StrictMode>
    <Router />
  </StrictMode>
);

interface NavigationDestination {
  id: Readonly<string | null>;
  index: Readonly<number>;
  key: Readonly<string | null>;
  sameDocument: Readonly<boolean>;
  url: Readonly<string>;
}

interface NavigateEvent {
  canIntercept: Readonly<boolean>;
  destination: Readonly<NavigationDestination>;
  downloadRequest: Readonly<string | null>;
  navigationType: Readonly<'push' | 'reload' | 'replace' | 'traverse'>;
  hashChange: Readonly<boolean>;
  formData: Readonly<FormData>;
  signal: Readonly<AbortSignal>;
  userInitiated: Readonly<boolean>;
  intercept(options?: {
	handler?: () => void;
	focusReset?: 'after-transition' | 'manual'
  }): void;
  scroll(): void;
}

let callbacks: Array<() => void> = [];

// @ts-expect-error
navigation.addEventListener('navigate', (event: NavigateEvent) => {
  if (shouldNotIntercept(event)) {
    return;
  }
  const url = new URL(event.destination.url);
  event.intercept({
	handler() {
		callbacks.forEach((cb) => cb());
	},
	focusReset: 'manual'
  });

});

function shouldNotIntercept(event: NavigateEvent) {
	console.log({event})
  if (event.navigationType === 'reload') {
    return true;
  }
  if (event.canIntercept === false) {
    return true;
  }
  if (event.downloadRequest) {
    return true;
  }
}

function Router() {
  const [url, setUrl] = useState('/rsc' + window.location.search);

  useEffect(() => {
    function handleNavigate() {
      startTransition(() => {
        setUrl('/rsc' + window.location.search);
      });
    }
    callbacks.push(handleNavigate);
    window.addEventListener('popstate', handleNavigate);
    return () => {
      callbacks.splice(callbacks.indexOf(handleNavigate), 1);
      window.removeEventListener('popstate', handleNavigate);
    };
  }, []);

  return (
    <>
      <ServerOutput url={url} />
      <DevPanel url={url} />
    </>
  );
}

const initialCache = new Map();

function ServerOutput({ url }) {
  const [cache, setCache] = useState(initialCache);
  if (!cache.has(url)) {
    cache.set(url, createFromFetch(fetch(url)));
  }
  const lazyJsx = cache.get(url);
  return use(lazyJsx);
}
