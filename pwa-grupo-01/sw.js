/// <reference lib="webworker" />

import { getMessaging, onBackgroundMessage } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-messaging-sw.js";
import { app } from "./js/firebase/app.js";

const version = "0.0.8";

export const messaging = getMessaging(app);

console.log("Service Worker initializing...");

onBackgroundMessage(messaging, (payload) => {
  console.log("Message received. ", payload);
  const notificationTitle = "Probando PWA";
  self.registration.showNotification(notificationTitle);
});

self.addEventListener("install", (event) => {
  console.log(`[${version}] Service Worker installing...`);
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activating.");
});

self.addEventListener("fetch", (event) => {
  console.log("Service Worker fetching.");
});

self.onmessage = (event) => {
  console.log("Service Worker received message:", event.data);
};

const versionBroadcastChannel = new BroadcastChannel("version");
versionBroadcastChannel.onmessage = (event) => {
  versionBroadcastChannel.postMessage(version);
};
