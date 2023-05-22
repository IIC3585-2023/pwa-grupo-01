import { createEffect, createSignal } from "./js/ui.js";

/**
 * @template T
 * @param {IDBRequest<T>} request
 * @returns {Promise<T>}
 */
function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * @param {string} name
 * @param {number} version
 * @param {object} options
 * @param {(event: IDBVersionChangeEvent, result: IDBDatabase) => void} options.onUpgradeNeeded
 * @returns {Promise<IDBDatabase>}
 */
function initIndexedDB(name, version, { onUpgradeNeeded = () => {} }) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    console.log("request", request);
    request.onupgradeneeded = (event) => onUpgradeNeeded(event, request.result);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Database blocked"));
    setTimeout(() => reject(new Error("Timeout")), 5000);
  });
}

let isBeenInitialized = false;
async function init(version = 1) {
  console.log("initIndexedDB");
  if (isBeenInitialized) return;
  isBeenInitialized = true;

  const postsDBRequest = initIndexedDB("main", version, {
    onUpgradeNeeded(event, result) {
      console.log("onUpgradeNeeded");
      result.createObjectStore("posts", { keyPath: "key" });
      result.createObjectStore("images", { keyPath: "url" });
      result.createObjectStore("notifications", { keyPath: "id", autoIncrement: true });
    },
  });

  const localDB = await postsDBRequest;
  console.log("localDB", localDB);

  return { localDB };
}

const store = init();
store.then(() => loadAllSavedPosts());

const [postsCacheSignal, setCacheData] = createSignal([]);
export { postsCacheSignal };

createEffect(() => {
  console.log("cacheData cambio a", postsCacheSignal());
});

async function loadAllSavedPosts() {
  const { localDB } = await store;

  const transaction = localDB.transaction("posts", "readonly");
  const objectStore = transaction.objectStore("posts");
  const posts = await promisifyRequest(objectStore.getAll());
  setCacheData(posts);
}

export async function addPostToCache(post) {
  const { localDB } = await store;

  const transaction = localDB.transaction(["posts"], "readwrite");
  const objectStore = transaction.objectStore("posts");

  await promisifyRequest(objectStore.add(post));
  await addImageToCache(post.resourceURL);
  await loadAllSavedPosts();
}

export function isPostSavedInCache(id) {
  return postsCacheSignal().some((post) => post.key === id);
}

async function addImageToCache(imageUrl, img) {
  // Open a connection to the database
  const { localDB } = await store;

  const transaction = localDB.transaction("images", "readonly");
  const objectStore = transaction.objectStore("images");

  const image = await promisifyRequest(objectStore.get(imageUrl));

  if (image) {
    console.log("Image already from cache");
  } else {
    // If the image is not in the database, fetch it and store it
    const repsonse = await fetch(imageUrl);
    const blob = await repsonse.blob();

    const transaction = localDB.transaction("images", "readwrite");
    const objectStore = transaction.objectStore("images");

    await promisifyRequest(objectStore.put({ url: imageUrl, blob }));
  }
}

/** @deprecated */
export async function getCacheImageData(imageURL) {
  const { localDB } = await store;

  const transaction = localDB.transaction("images", "readonly");
  const objectStore = transaction.objectStore("images");

  return promisifyRequest(objectStore.get(imageURL));
}

export function removePostFromCache(post) {
  console.log("removing post from cache", post);
  deleteCache("images", post.resourceURL);
  deleteCache("posts", post.key);
  loadAllSavedPosts();
}

async function deleteCache(type, id) {
  const { localDB } = await store;

  const transaction = localDB.transaction(type, "readwrite");
  const objectStore = transaction.objectStore(type);
  await promisifyRequest(objectStore.delete(id));
}

export async function addNotificationToCache(notification) {
  const { localDB } = await store;

  const transaction = localDB.transaction("notifications", "readwrite");
  const objectStore = transaction.objectStore("notifications");

  promisifyRequest(objectStore.add(notification));
}

const [notificationSignal, setNotificationSignal] = createSignal(/** @type {any[]} */ ([]));
export async function getNotificationsFromCache() {
  const { localDB } = await store;

  const transaction = localDB.transaction("notifications", "readonly");
  const objectStore = transaction.objectStore("notifications");

  const notifications = await promisifyRequest(objectStore.getAll());
  setNotificationSignal(notifications);
}
getNotificationsFromCache();

export { notificationSignal };
