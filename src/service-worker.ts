/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */

// Lets the app open without a network connection once it has loaded once,
// and be installed as an app. The build lists every file to keep (the
// self.__WB_MANIFEST below); they're served from the cache, and a new
// version is fetched in the background and used from the next visit.
import { clientsClaim } from 'workbox-core';
import { createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';

declare const self: ServiceWorkerGlobalScope;

clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

// The app has one page: any navigation gets index.html.
const fileExtension = /\/[^/?]+\.[^/]+$/;
registerRoute(({ request, url }) => {
  if (request.mode !== 'navigate') return false;
  if (url.pathname.startsWith('/_')) return false;
  if (url.pathname.match(fileExtension)) return false;
  return true;
}, createHandlerBoundToURL(process.env.PUBLIC_URL + '/index.html'));

// The app asks a waiting new version to take over when you choose to.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
