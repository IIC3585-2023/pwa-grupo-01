"use strict";

import { animateDomUpdate, createEffect, createSignal } from "./js/ui.js";

function getPWADisplayMode() {
  if (document.referrer.startsWith("android-app://")) {
    return "twa";
  } else if ("standalone" in navigator || window.matchMedia("(display-mode: standalone)").matches) {
    return "standalone";
  }
  return "browser";
}

const basePath = "/pwa-grupo-01/";
const serviceWorkerUrl = "/pwa-grupo-01/sw.js";

function Home() {
  const el = document.createElement("div");
  el.innerHTML = "Home";
  return el;
}

function Likes() {
  const el = document.createElement("div");
  el.innerHTML = "Likes";
  return el;
}

function Saved() {
  const el = document.createElement("div");
  el.innerHTML = "Saved";
  return el;
}

function Settings() {
  const el = document.createElement("div");
  el.innerHTML = "Settings";
  return el;
}

const pages = [
  { btnId: "home-btn", component: Home },
  { btnId: "likes-btn", component: Likes },
  { btnId: "saved-btn", component: Saved },
  { btnId: "settings-btn", component: Settings },
];

window.addEventListener("DOMContentLoaded", () => {
  const contentEl = document.getElementById("content");
  if (!contentEl) throw new Error("Content element not found.");
  const logoBtn = document.getElementById("logo-btn");
  if (!logoBtn) throw new Error("Logo button element not found.");
  const createDialog = /** @type {HTMLDialogElement | null} */ (document.getElementById("upload-post-dialog"));
  if (!createDialog) throw new Error("Create dialog element not found.");
  const createBtn = document.getElementById("create-btn");
  if (!createBtn) throw new Error("Create button element not found.");
  const cancelUploadBtn = document.getElementById("cancel-upload-btn");
  if (!cancelUploadBtn) throw new Error("Cancel upload button element not found.");

  const pagesWithBtns = pages.map((page) => {
    const btn = document.getElementById(page.btnId);
    if (!btn) throw new Error(`Button element not found: ${page.btnId}.`);
    return { ...page, btn };
  });

  createBtn.addEventListener("click", () => createDialog.showModal());
  cancelUploadBtn.addEventListener("click", () => createDialog.close());

  const [page, setPage] = createSignal(pagesWithBtns[0]);

  logoBtn.addEventListener("click", () => setPage(pagesWithBtns[0]));
  pagesWithBtns[0].btn.classList.add("active");

  for (const page of pagesWithBtns) {
    page.btn.addEventListener("click", () => setPage(page));
  }

  let oldPage = page();
  createEffect(() => {
    if (oldPage === page()) {
      oldPage = page();
      contentEl.innerHTML = "";
      contentEl.appendChild(oldPage.component());
      return;
    }

    const pageElement = page();
    oldPage.btn.classList.remove("active");
    pageElement.btn.classList.add("active");

    const slideToTheRight = pagesWithBtns.indexOf(oldPage) > pagesWithBtns.indexOf(pageElement);
    contentEl.classList.toggle("to-right", slideToTheRight);
    contentEl.classList.toggle("to-left", !slideToTheRight);

    animateDomUpdate(() => {
      contentEl.innerHTML = "";
      contentEl.appendChild(pageElement.component());
    });
    oldPage = pageElement;
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      await navigator.serviceWorker.register(serviceWorkerUrl, {
        scope: basePath,
      });
    });
  }
});
