import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-messaging.js";
import { ref as refDB, set as setDB } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-database.js";
import { createSignal, createEffect } from "../ui.js";
import { app, firebaseConfig } from "./app.js";
import { userSignal } from "./auth.js";
import { db } from "./db.js";

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

createEffect(async () => {
  const user = userSignal();
  const token = tokenSignal();

  if (!user || !token) return;

  const userId = user.reloadUserInfo.screenName;

  await setDB(refDB(db, `users/${userId}/tokens/${token}`), true);
});

export { tokenSignal };
