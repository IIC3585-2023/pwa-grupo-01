/// <reference lib="webworker" />

import { getMessaging, onBackgroundMessage } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-messaging-sw.js";
import { app } from "./js/firebase/app.js";

const version = "0.3.0";

const staticFiles = [
  "/pwa-grupo-01/",
  "/pwa-grupo-01/icons/PWgAg-192.png",
  "/pwa-grupo-01/icons/PWgAg-512.png",
  "/pwa-grupo-01/icons/PWgAg.svg",
  "/pwa-grupo-01/js/firebase/app.js",
  "/pwa-grupo-01/js/firebase/auth.js",
  "/pwa-grupo-01/js/firebase/db.js",
  "/pwa-grupo-01/js/firebase/messaging.js",
  "/pwa-grupo-01/js/render.js",
  "/pwa-grupo-01/js/ui.js",
  "/pwa-grupo-01/js/utils.js",
  "/pwa-grupo-01/index.html",
  "/pwa-grupo-01/manifest.json",
  "/pwa-grupo-01/style.css",
  "/pwa-grupo-01/sw.js",
];

export const messaging = getMessaging(app);

console.log("Service Worker initializing...");

onBackgroundMessage(messaging, (payload) => {
  console.log("Message received in background:", payload);
  if (!payload.notification) return;
  const title = payload.notification.title || "(sin título)";
  self.registration.showNotification(title, payload.notification);
});

addEventListener("install", (event) => {
  console.log(`[${version}] Service Worker installing...`);
  event.waitUntil(
    caches.open("pwagag-cache-" + version).then((cache) => {
      cache.addAll(staticFiles);
    })
  );
});

addEventListener("activate", (event) => {
  console.log("Service Worker activating.");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith("pwagag-cache-") && cacheName !== "pwagag-cache-" + version)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
});

addEventListener("fetch", (event) => {
  console.log("Service Worker fetching.");
  event.respondWith(
    caches.match(event.request).then((response) => {
      // If the request is in the cache, return it
      if (response) return response;

      return fetch(event.request);
    })
  );
});

const versionBroadcastChannel = new BroadcastChannel("version");
versionBroadcastChannel.onmessage = (event) => {
  if (event.data === "version") versionBroadcastChannel.postMessage(version);
};
