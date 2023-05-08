/// <reference lib="webworker" />

import { getMessaging, onBackgroundMessage } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-messaging-sw.js";
import { app } from "./js/firebase/app.js";

const version = "0.1.0";

const staticFiles = [
  "/pwa-grupo-01/",
  "/pwa-grupo-01/index.html",
  "/pwa-grupo-01/style.css",
  "/pwa-grupo-01/main.js",
  "/pwa-grupo-01/js/ui.js",
  "/pwa-grupo-01/js/utils.js",
  "/pwa-grupo-01/js/firebase/app.js",
  "/pwa-grupo-01/js/firebase/auth.js",
  "/pwa-grupo-01/js/firebase/db.js",
  "/pwa-grupo-01/js/firebase/messaging.js",
];

export const messaging = getMessaging(app);

console.log("Service Worker initializing...");

onBackgroundMessage(messaging, (payload) => {
  console.log("Message received. ", payload);
  const notificationTitle = "Probando PWA";
  self.registration.showNotification(notificationTitle);
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

      // TODO: cache de otras cosas

      // Esto de abajo no se usa pq cachea todo
      // // If the request is not in the cache, fetch it
      // return fetch(event.request).then((response) => {
      //   // Clone the response to add it to the cache
      //   const clonedResponse = response.clone();

      //   caches.open("my-cache").then((cache) => {
      //     // Add the response to the cache
      //     cache.put(event.request, clonedResponse);
      //   });

      //   return response;
      // });

      return fetch(event.request);
    })
  );
});

const versionBroadcastChannel = new BroadcastChannel("version");
versionBroadcastChannel.onmessage = (event) => {
  if (event.data === "version") versionBroadcastChannel.postMessage(version);
};
