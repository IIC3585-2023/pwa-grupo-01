/// <reference lib="webworker" />
const version = "0.0.5";

import { app } from "./js/firebase/app.js";

self.addEventListener("install", (event) => {
  console.log(`[${version}] Service Worker installing...`);
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activating.");
});

self.addEventListener("fetch", (event) => {
  console.log("Service Worker fetching.");
});

self.addEventListener("push", (event) => {
  // Handle incoming push notification
  console.log("Push received: ", event);
});
