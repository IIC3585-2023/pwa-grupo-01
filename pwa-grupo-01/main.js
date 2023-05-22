"use strict";

import { animateDomUpdate, createEffect, createSignal, appendNode, getElById } from "./js/ui.js";
import { writePostData, postsData } from "./js/firebase/db.js";
import { getLinkGitHubUser, versionSignal, waitForImageLoad } from "./js/utils.js";
import { userSignal, logOut, signIn } from "./js/firebase/auth.js";
import { allowedNotificationSignal, requestNotificationPermission, tokenSignal } from "./js/firebase/messaging.js";
import { postsCacheSignal } from "./localDB.js";
import { renderPost } from "./js/render.js";
import { reloadSW, registerSW, deleteCache } from "./js/registration.js";

/** @param {(user: User | null) => void} fn */
const createEffectWithUser = (fn) => createEffect(() => fn(userSignal()));
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
  appendNode(parent, "ul", (saved) => {
    saved.classList.add("flex", "flex-col", "items-center", "bg-black", "gap-4", "pb-24", "h-full");

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
      version.classList.add("text-gray-400", "my-4");
      createEffect(() => {
        version.innerHTML = `Version: ${versionSignal()}`;
      });
    });

    appendNode(userpage, "div", (actions) => {
      actions.className = "flex flex-col items-stretch gap-4";

      appendNode(actions, "button", (btn) => {
        let shouldAskForNotifications = true;
        btn.classList.add("p-2", "rounded-md", "text-white");
        createEffect(() => {
          const allowedNotifications = allowedNotificationSignal();
          btn.classList.toggle("bg-blue-500", !allowedNotifications);
          btn.classList.toggle("bg-blue-900", allowedNotifications);
          if (allowedNotificationSignal()) {
            btn.textContent = "Notificaciones ok";
            shouldAskForNotifications = false;
            btn.disabled = true;
          } else {
            btn.textContent = "Activar notificaciones";
            shouldAskForNotifications = true;
            btn.disabled = false;
          }
        });

        btn.addEventListener("click", () => {
          if (!shouldAskForNotifications) return;
          requestNotificationPermission();
        });
      });

      appendNode(actions, "button", (clearCacheBtn) => {
        clearCacheBtn.textContent = "Limpiar cache y recargar";
        clearCacheBtn.classList.add("p-2", "bg-blue-500", "rounded-md", "text-white");
        clearCacheBtn.addEventListener("click", () => deleteCache().then(() => location.reload()));
      });

      appendNode(actions, "button", (clearCacheBtn) => {
        clearCacheBtn.textContent = "Reiniciar SW";
        clearCacheBtn.classList.add("p-2", "bg-blue-500", "rounded-md", "text-white");
        clearCacheBtn.addEventListener("click", reloadSW);
      });

      appendNode(actions, "button", (btn) => {
        btn.classList.add("p-2", "rounded-md", "text-white");
        const [copiedSignal, setCopied] = createSignal(false);
        createEffect(() => {
          const copied = copiedSignal();
          const hasToken = !!tokenSignal();
          btn.classList.toggle("bg-blue-500", !copied && hasToken);
          btn.classList.toggle("bg-blue-900", copied || !hasToken);
          if (copied) {
            btn.textContent = "Copiado";
            btn.disabled = true;
          } else {
            btn.textContent = hasToken ? "Copiar MS token" : "Cargando MS token";
            btn.disabled = !hasToken;
          }
        });

        btn.addEventListener("click", () => {
          navigator.clipboard.writeText(tokenSignal());
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      });
    });
  });
}

window.addEventListener("DOMContentLoaded", () => {
  attachMainNavigation();
  attachCreatePost();
  attachUserImageInNav();
  if ("serviceWorker" in navigator) window.addEventListener("load", registerSW);
});

export const pages = [
  { btnId: "home-btn", component: Home },
  { btnId: "likes-btn", component: Likes },
  { btnId: "saved-btn", component: Saved },
  { btnId: "user-btn", component: User },
];

export const [pageIndexSignal, setPageIndex] = createSignal(0);

function attachMainNavigation() {
  const contentEl = getElById("content");
  const logoBtn = getElById("logo-btn");
  const createBtn = /** @type {HTMLButtonElement} */ (getElById("create-btn"));

  const pagesWithBtns = pages.map((page) => ({ ...page, btn: getElById(page.btnId) }));
  setPageIndex(0);

  logoBtn.addEventListener("click", () => setPageIndex(0));
  pagesWithBtns[0].btn.classList.add("active");

  for (let i = 0; i < pagesWithBtns.length; i++) {
    const page = pagesWithBtns[i];
    page.btn.addEventListener("click", () => setPageIndex(i));
  }

  let oldPageIndex = 0;

  createEffectWithUser((user) => {
    const newPageIndex = pageIndexSignal();

    if (oldPageIndex === newPageIndex) {
      // No hay que cambiar nada
      contentEl.innerHTML = "";
      pagesWithBtns[oldPageIndex].component(contentEl);
      return;
    }

    pagesWithBtns[oldPageIndex].btn.classList.remove("active");

    const slideToTheRight = oldPageIndex > newPageIndex;

    animateDomUpdate(
      () => {
        contentEl.classList.toggle("to-right", slideToTheRight);
        contentEl.classList.toggle("to-left", !slideToTheRight);

        createBtn.disabled = !user || newPageIndex !== 0;

        contentEl.innerHTML = "";
        const page = pagesWithBtns[newPageIndex];
        page.btn.classList.add("active");
        page.component(contentEl);
      },
      () => {
        contentEl.classList.remove("to-right", "to-left");
        oldPageIndex = newPageIndex;
      }
    );
  });

  return pageIndexSignal;
}

function attachUserImageInNav() {
  const img = /** @type {HTMLImageElement} */ (getElById("bar-user-img"));
  createEffectWithUser((user) => {
    document.documentElement.dataset["loggedin"] = String(!!user);
    img.src = user?.photoURL ?? "";
  });
}

function attachCreatePost() {
  const createBtn = /** @type {HTMLButtonElement} */ (getElById("create-btn"));
  const createDialog = /** @type {HTMLDialogElement} */ (getElById("upload-post-dialog"));
  const uploadImgInput = /** @type {HTMLInputElement} */ (getElById("upload-img-input"));
  const uploadImgDnD = /** @type {HTMLLabelElement} */ (getElById("upload-img-dnd"));
  const uploadPreviewContainer = /** @type {HTMLDivElement} */ (getElById("upload-img-preview-container"));
  const uploadPreviewImg = /** @type {HTMLImageElement} */ (getElById("upload-img-preview"));
  const uploadImgRemove = /** @type {HTMLButtonElement} */ (getElById("upload-img-remove"));
  const uploadCaption = /** @type {HTMLInputElement} */ (getElById("upload-caption"));
  const cancelUploadBtn /** @type {HTMLInputElement} */ = getElById("cancel-upload-btn");
  const savePostBtn /** @type {HTMLInputElement} */ = getElById("upload-submit");

  createBtn.addEventListener("click", () => createDialog.showModal());

  function resetUpload() {
    clearImgInput();
    uploadCaption.value = "";
  }

  function clearImgInput() {
    uploadImgInput.value = "";
    uploadImgInput.dispatchEvent(new Event("change"));
  }

  function closeDialog() {
    createDialog.close();
    resetUpload();
  }

  uploadImgRemove.addEventListener("click", () => clearImgInput());
  cancelUploadBtn.addEventListener("click", () => closeDialog());

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

  /** @param {File} img, @param {User} user */
  async function createPost(img, user) {
    uploadPreviewImg.classList.add("new-post");
    /** @type {HTMLImageElement | undefined} */
    let post;
    animateDomUpdate(
      async () => {
        const postId = await writePostData(user?.reloadUserInfo, uploadCaption.value, img);
        uploadPreviewImg.classList.remove("new-post");
        post = /** @type {HTMLImageElement} */ (getElById("img-" + postId));
        if (post) {
          post.classList.add("new-post");
          await waitForImageLoad(post);
        }
        console.log("animating post");
        closeDialog();
      },
      () => {
        if (!post) return;
        post.classList.remove("new-post");
      }
    );
  }

  savePostBtn.addEventListener("click", async () => {
    const img = uploadImgInput.files?.[0];
    if (!img) return alert("Please select an image");
    const user = userSignal();
    if (!user) return alert("Please login to create a post");
    try {
      await createPost(img, user);
    } catch (error) {
      console.error(error);
    }
  });
}
