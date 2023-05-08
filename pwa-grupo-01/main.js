"use strict";

import { animateDomUpdate, createEffect, createSignal, appendNode, getElById } from "./js/ui.js";
import { user, logOut, signIn } from "./js/firebase/auth.js";
import { writePostData, postsData } from "./js/firebase/db.js";
import { getLinkGitHubUser, getSWVersion, versionSignal } from "./js/utils.js";
import { initializeNotificationService, requestNotificationPermission, tokenSignal } from "./js/firebase/messaging.js";
import { postsCacheSignal } from "./localDB.js";
import { renderPost } from "./js/render.js";

/** @param {(user: User | null) => void} fn */
const createEffectWithUser = (fn) => createEffect(() => fn(user()));
/** @param {(user: User) => void} fn */
const createEffectWithLoggedIn = (fn) => createEffectWithUser((u) => u && fn(u));

function getPWADisplayMode() {
  if (document.referrer.startsWith("android-app://")) {
    return "twa";
  } else if ("standalone" in navigator || window.matchMedia("(display-mode: standalone)").matches) {
    return "standalone";
  }
  return "browser";
}

// function replaceURL(path) {
//   const currentUrl = window.location.href;
//   const newUrl = currentUrl.replace(/\/$/, '/') + `#${path}`;
//   window.location.href = newUrl;
// }

const basePath = "/pwa-grupo-01/";
const serviceWorkerUrl = "/pwa-grupo-01/sw.js";

/** @typedef {(parent: HTMLElement) => void} PageComponent */

/** @type {PageComponent} */
function Home(parent) {
  appendNode(parent, "ul", (home) => {
    home.classList.add("flex", "flex-col", "items-center", "bg-black", "gap-4", "pb-24", "h-full");

    createEffectWithUser((user) => {
      home.innerHTML = "";
      for (const post of postsData()) {
        home.appendChild(renderPost(post, user));
      }
    });
  });
}

/** @type {PageComponent} */
function Likes(parent) {
  appendNode(parent, "div", (likes) => {
    likes.innerHTML = "Likes";
  });
}

/** @type {PageComponent} */
function Saved(parent) {
  appendNode(parent, "div", (saved) => {
    saved.innerHTML = "Saved";
    createEffectWithUser((user) => {
      saved.innerHTML = "";
      for (const post of postsCacheSignal()) {
        saved.appendChild(renderPost(post, user, { isInSaved: true }));
      }
    });
  });
}

/** @type {PageComponent} */
function User(parent) {
  appendNode(parent, "div", (userpage) => {
    // Logged out
    userpage.className = "flex flex-col items-center gap-4 h-full px-2 py-6";
    appendNode(userpage, "div", (loggedOut) => {
      createEffectWithUser((user) => {
        loggedOut.style.display = user ? "none" : "block";
      });

      appendNode(loggedOut, "button", (loginBtn) => {
        loginBtn.textContent = "Login";
        loginBtn.classList.add("p-2", "bg-blue-500", "rounded-md", "text-white");
        loginBtn.addEventListener("click", signIn);
      });
    });

    // Logged in
    appendNode(userpage, "div", (loggedIn) => {
      loggedIn.className = "flex-col items-center gap-4";
      createEffectWithUser((user) => {
        loggedIn.style.display = user ? "flex" : "none";
      });

      appendNode(loggedIn, "img", (userImg) => {
        userImg.style.width = "200px";
        userImg.style.height = "200px";
        userImg.classList.add("rounded-full");
        createEffectWithLoggedIn((user) => {
          userImg.src = user.photoURL;
        });
      });

      appendNode(loggedIn, "div", (userNameDiv) => {
        createEffectWithLoggedIn((user) => {
          userNameDiv.innerHTML = `@${getLinkGitHubUser(user.reloadUserInfo.screenName)}`;
        });
      });

      appendNode(loggedIn, "button", (logoutBtn) => {
        logoutBtn.addEventListener("click", logOut);
        logoutBtn.textContent = "Logout";
        logoutBtn.classList.add("p-2", "bg-red-500", "rounded-md", "text-white");
      });
    });

    appendNode(userpage, "div", (version) => {
      createEffect(() => {
        version.innerHTML = `Version: ${versionSignal()}`;
      });
    });

    appendNode(userpage, "div", (swVersion) => {
      swVersion.classList.add("text-center");
      createEffect(() => {
        swVersion.innerHTML = `MS token<br>${tokenSignal()}`;
      });
    });
  });
}

const pages = [
  { btnId: "home-btn", component: Home },
  { btnId: "likes-btn", component: Likes },
  { btnId: "saved-btn", component: Saved },
  { btnId: "user-btn", component: User },
];

window.addEventListener("DOMContentLoaded", () => {
  atachCreatePost();
  atachUserImageInNav();
  atachMainNavegation();
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      const registration = await navigator.serviceWorker.register(serviceWorkerUrl, {
        scope: basePath,
        type: "module",
      });
      initializeNotificationService(registration).then(() => requestNotificationPermission());
      getSWVersion(registration);
    });
  }
});

function atachMainNavegation() {
  const contentEl = getElById("content");
  const logoBtn = getElById("logo-btn");

  const pagesWithBtns = pages.map((page) => ({ ...page, btn: getElById(page.btnId) }));

  const [page, setPage] = createSignal(pagesWithBtns[0]);

  logoBtn.addEventListener("click", () => setPage(pagesWithBtns[0]));
  pagesWithBtns[0].btn.classList.add("active");

  for (const page of pagesWithBtns) {
    page.btn.addEventListener("click", () => setPage(page));
  }

  let oldPage = page();
  createEffect(() => {
    if (oldPage === page()) {
      // En pruner render
      oldPage = page();
      contentEl.innerHTML = "";
      oldPage.component(contentEl);
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
      pageElement.component(contentEl);
    });
    oldPage = pageElement;
  });
}

function atachUserImageInNav() {
  const img = /** @type {HTMLImageElement} */ (getElById("bar-user-img"));
  createEffectWithUser((user) => {
    document.documentElement.dataset["loggedin"] = String(!!user);
    img.src = user?.photoURL ?? "";
  });
}

function atachCreatePost() {
  createEffectWithUser((user) => {
    const createBtn /** @type {HTMLInputElement} */ = getElById("create-btn");
    if (!user) {
      createBtn.classList.add("hidden");
      createBtn.classList.remove("flex");
      return;
    }
    createBtn.classList.remove("hidden");
    createBtn.classList.add("flex");
    const createDialog = /** @type {HTMLDialogElement} */ (getElById("upload-post-dialog"));
    const uploadImgInput = /** @type {HTMLInputElement} */ (getElById("upload-img-input"));
    const uploadImgDnD = /** @type {HTMLLabelElement} */ (getElById("upload-img-dnd"));
    const uploadPreviewContainer = /** @type {HTMLDivElement} */ (getElById("upload-img-preview-container"));
    const uploadPreviewImg = /** @type {HTMLImageElement} */ (getElById("upload-img-preview"));
    const uploadImgRemove = /** @type {HTMLButtonElement} */ (getElById("upload-img-remove"));
    const uploadCaption = /** @type {HTMLInputElement} */ (getElById("upload-caption"));
    const cancelUploadBtn /** @type {HTMLInputElement} */ = getElById("cancel-upload-btn");
    const savePostBtn /** @type {HTMLInputElement} */ = getElById("upload-submit");

    function resetUpload() {
      clearImgInput();
      uploadCaption.value = "";
    }

    function clearImgInput() {
      uploadImgInput.value = "";
      uploadImgInput.dispatchEvent(new Event("change"));
    }

    createBtn.addEventListener("click", () => createDialog.showModal());

    cancelUploadBtn.addEventListener("click", () => {
      createDialog.close();
      resetUpload();
    });

    savePostBtn.addEventListener("click", () => {
      try {
        writePostData(user?.reloadUserInfo, uploadCaption.value);
        createDialog.close();
        resetUpload();
      } catch (error) {
        console.error(error);
      }
    });
    // Image preview
    uploadImgInput.addEventListener("change", () => {
      if (!uploadImgInput.files) return;
      const [file] = uploadImgInput.files;

      if (file) {
        uploadImgDnD.style.display = "none";
        uploadPreviewContainer.style.display = "";
        uploadPreviewImg.src = URL.createObjectURL(file);
      } else {
        uploadImgDnD.style.display = "";
        uploadPreviewImg.src = "";
        uploadPreviewContainer.style.display = "none";
      }
    });
    uploadImgRemove.addEventListener("click", () => clearImgInput());

    // Drag and drop
    uploadImgDnD.ondrop = (e) => {
      if (!uploadImgInput.files || !e.dataTransfer) return;
      e.preventDefault();
      uploadImgInput.files = e.dataTransfer.files;
      uploadImgInput.dispatchEvent(new Event("change"));
    };

    uploadImgDnD.ondragover = (e) => {
      e.preventDefault();
      uploadImgDnD.classList.add("dragover");
    };

    uploadImgDnD.ondragleave = (e) => {
      e.preventDefault();
      uploadImgDnD.classList.remove("dragover");
    };
  });
}
