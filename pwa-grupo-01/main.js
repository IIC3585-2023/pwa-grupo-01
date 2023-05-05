"use strict";

import { animateDomUpdate, createEffect, createSignal, appendNode, getElById } from "./js/ui.js";
import { app, user, signIn, logOut, postsData, writePostData, deletePostData } from "./firebase.js";
import { getTimeAgo } from "./js/utils.js";

/** @typedef {import("./firebase.js").User} User */

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
    home.classList.add("flex", "flex-col", "items-center", "p-4");

    createEffect(() => {
      home.innerHTML = "";
      const posts = postsData();
      console.log(posts);
      const date = Date.now();
      for (const post of posts) {
        appendNode(home, "li", (postEl) => {
          postEl.classList.add("flex", "mb-2", "flex-col");
          appendNode(postEl, "div", (description) => {
            description.innerHTML = post.description;
            description.classList.add("font-bold");
          });
          appendNode(postEl, "img", (userImg) => {
            userImg.src = post.resourceURL;
            userImg.classList.add("w-40", "h-40", "mr-2");
          });
          appendNode(postEl, "div", (userName) => {
            userName.innerHTML = `by @${post.authorID} ${getTimeAgo(post.key, date)}`;
            userName.classList.add("text-center");
          });
          createEffectWithUser((user) => {
            if (user.reloadUserInfo.screenName === post.authorID) {
              appendNode(postEl, "button", (button) => {
                button.innerHTML = `Delete Post`;
                // TODO: Lo dejaria solo como una cruz y en la parte del perfil
                // Hice esta wea acá solo pa probar la feature del back
                button.classList.add(
                  "text-white",
                  "bg-red-700",
                  "hover:bg-red-800",
                  "font-medium",
                  "rounded-lg",
                  "text-sm",
                  "py-1.5",
                  "my-1",
                  "dark:bg-red-600"
                );
                button.addEventListener("click", () => {
                  const confirmed = confirm("Are you sure you want to delete this post?");
                  if (confirmed) {
                    deletePostData(post.key);
                  }
                });
              });
            }
          });
          if (posts[posts.length - 1] !== post) {
            appendNode(postEl, "hr", (hrEl) => {
              hrEl.classList.add("my-2");
            });
          }
        });
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
  });
}

/** @type {PageComponent} */
function User(parent) {
  appendNode(parent, "div", (userpage) => {
    // Logged out
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
      createEffectWithUser((user) => {
        loggedIn.style.display = user ? "block" : "none";
      });

      appendNode(loggedIn, "img", (userImg) => {
        userImg.style.width = "200px";
        userImg.style.height = "200px";
        createEffectWithLoggedIn((user) => {
          userImg.src = user.photoURL;
        });
      });

      appendNode(loggedIn, "div", (userNameDiv) => {
        createEffectWithLoggedIn((user) => {
          userNameDiv.innerHTML = `<b>Username:</b> <a target="_blank" rel="noopener noreferrer" href="https://github.com/${user.reloadUserInfo.screenName}">@${user.reloadUserInfo.screenName}</a>`;
        });
      });

      appendNode(loggedIn, "button", (logoutBtn) => {
        logoutBtn.addEventListener("click", logOut);
        logoutBtn.textContent = "Logout";
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
      await navigator.serviceWorker.register(serviceWorkerUrl, { scope: basePath });
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
        writePostData(user?.reloadUserInfo?.screenName, uploadCaption.value);
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
