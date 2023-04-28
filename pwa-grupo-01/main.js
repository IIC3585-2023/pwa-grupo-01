"use strict";

import { createElement } from "./js/ui.js";

const basePath = "/pwa-grupo-01/";
const serviceWorkerUrl = "/pwa-grupo-01/sw.js";

function init() {
  const el = createElement();
  console.log(el);
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      await navigator.serviceWorker.register(serviceWorkerUrl, {
        scope: basePath,
      });
    });
  }
}

window.addEventListener("DOMContentLoaded", init);
