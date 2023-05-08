import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-messaging.js";
import { createSignal } from "../ui.js";
import { app, firebaseConfig } from "./app.js";

export const messaging = getMessaging(app);

export async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    console.log("Notification permission granted.");
  }
}

const [tokenSignal, setToken] = createSignal("");
/** @param {ServiceWorkerRegistration} serviceWorkerRegistration */
export async function initializeNotificationService(serviceWorkerRegistration) {
  const token = await getToken(messaging, { vapidKey: firebaseConfig.vapidKey, serviceWorkerRegistration });
  setToken(token);
  onMessage(messaging, (payload) => {
    console.log("Message received. ", payload);
  });
}
export { tokenSignal };
