import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-messaging.js";
import { firebaseConfig } from "./app.js";
import { messaging } from "./messaging.js";

export async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    console.log("Notification permission granted.");
  }
}

/** @param {ServiceWorkerRegistration} serviceWorkerRegistration */
export async function initializeNotificationService(serviceWorkerRegistration) {
  const token = await getToken(messaging, { vapidKey: firebaseConfig.vapidKey, serviceWorkerRegistration });
  console.log("Token:", token);
  onMessage(messaging, (payload) => {
    console.log("Message received. ", payload);
    // ...
  });
}

requestNotificationPermission();
