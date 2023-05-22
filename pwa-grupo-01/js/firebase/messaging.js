import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-messaging.js";
import { ref as refDB, set as setDB } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-database.js";
import { createSignal, createEffect } from "../ui.js";
import { app, firebaseConfig } from "./app.js";
import { userSignal } from "./auth.js";
import { db } from "./db.js";
import { setPageIndex } from "../../main.js";
import { registrationSignal } from "../registration.js";

export const messaging = getMessaging(app);

const [allowedNotificationSignal, setAllowedNotificationPermission] = createSignal(Notification.permission === "granted");
navigator.permissions.query({ name: "notifications" }).then((notificationPerm) => {
  notificationPerm.addEventListener("change", () => {
    setAllowedNotificationPermission(Notification.permission === "granted");
  });
});
export { allowedNotificationSignal };

export async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    console.log("Notification permission granted.");
  }
  return permission === "granted";
}

createEffect(() => {
  const registration = registrationSignal();
  if (allowedNotificationSignal() && registration) {
    initializeNotificationService(registration);
  }
});

const [tokenSignal, setToken] = createSignal("");
/** @param {ServiceWorkerRegistration} serviceWorkerRegistration */
export async function initializeNotificationService(serviceWorkerRegistration) {
  const token = await getToken(messaging, { vapidKey: firebaseConfig.vapidKey, serviceWorkerRegistration });
  setToken(token);
  onMessage(messaging, (payload) => {
    console.log("Message received in foreground:", payload);
    if (!payload.notification) return;
    const title = payload.notification.title || "(sin título)";
    const notification = new Notification(title, { ...payload.notification, icon: "/pwa-grupo-01/icons/PWgAg-512.png" });

    notification.addEventListener("click", () => {
      setPageIndex(1);
      notification.close();
    });
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
