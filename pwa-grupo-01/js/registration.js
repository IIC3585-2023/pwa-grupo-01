import { createSignal } from "./ui.js";
import { getSWVersion } from "./utils.js";

const basePath = new URL(window.location.href).pathname;
const serviceWorkerUrl = `${basePath.replace(/\/+$/, "")}/sw.js`;

/** @typedef {ReturnType<typeof createSignal<null | ServiceWorkerRegistration>>} SWCreateSignal */
const [registrationSignal, setRegistration] = /** @type {SWCreateSignal} */ (createSignal(null));

export { registrationSignal };

export async function registerSW() {
  const registration = await navigator.serviceWorker.register(serviceWorkerUrl, { scope: basePath, type: "module" });
  setRegistration(registration);
  registration.addEventListener("updatefound", () => {
    registration.update();
  });
  await getSWVersion();
}

export async function reloadSW() {
  const registration = registrationSignal();
  if (!registration) return;

  // Delete old caches
  await deleteCache();

  // Register new service worker
  await registration.unregister();
  await registerSW();
}

export async function deleteCache() {
  const requestPromise = await fetch(serviceWorkerUrl, { cache: "reload" });
  const cachesPromise = caches.keys().then((cacheNames) => {
    return Promise.all(
      cacheNames.map((cacheName) => {
        return caches.delete(cacheName);
      })
    );
  });
  await Promise.all([requestPromise, cachesPromise]);
}
