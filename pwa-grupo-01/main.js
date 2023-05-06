"use strict";

import { animateDomUpdate, createEffect, createSignal, appendNode, getElById, querySelect } from "./js/ui.js";
import {
  app,
  user,
  signIn,
  logOut,
  postsData,
  writePostData,
  deletePostData,
  likePost,
  dislikePost,
} from "./firebase.js";
import { getTimeAgo, getLinkGitHubUser } from "./js/utils.js";
import { cacheData, cacheImageData, cacheImage, cachePost, uncachePost } from "./localDB.js";

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

const postTemplate = /** @type {HTMLTemplateElement} */ (getElById("post-template"));
/** @type {PageComponent} */
function Home(parent) {
  appendNode(parent, "ul", (home) => {
    home.classList.add("flex", "flex-col", "items-center", "bg-black", "gap-4", "pb-24");

    createEffectWithUser((user) => {
      home.innerHTML = "";
      const posts = postsData();

      for (const post of posts) {
        const likes = post?.likes ? Object.keys(post.likes) : [];
        const numLikes = likes.length;

        const postElement = /** @type {HTMLLIElement} */ (postTemplate.content.cloneNode(true));

        const ownerAvatar = querySelect(postElement, ".post-owner-avatar");
        ownerAvatar.src = post?.authorImg;
        // fetch(`https://api.github.com/users/${post.authorID}`).then((response) => {
        //   if (response.ok) {
        //     response.json().then((data) => {
        //       ownerAvatar.src = data?.avatar_url;
        //     })
        //   }
        // });

        const ownerName = querySelect(postElement, ".post-owner-name");
        ownerName.innerHTML = getLinkGitHubUser(post.authorID);

        const createdAt = /** @type {HTMLTimeElement} */ (querySelect(postElement, ".post-created-at"));
        createdAt.innerHTML = getTimeAgo(post.key);
        createdAt.dateTime = new Date(+post.key).toISOString();

        const postFig = /** @type {HTMLElement} */ (querySelect(postElement, "figure"));
        const captionId = `caption-${post.key}`;
        postFig.setAttribute("aria-labelledby", captionId);

        const img = /** @type {HTMLImageElement} */ (querySelect(postElement, ".post-img"));
        img.src = post.resourceURL;

        const caption = querySelect(postElement, ".post-caption");
        caption.innerHTML = post.description;
        caption.id = captionId;

        const likeCount = querySelect(postElement, ".post-like-count");
        const formattedLikes = new Intl.NumberFormat("es-CL", { compactDisplay: "short" }).format(numLikes);
        likeCount.innerHTML = `${formattedLikes} like${numLikes === 1 ? "" : "s"}`;

        const saveButton = querySelect(postElement, ".post-save");

        const deleteButton = querySelect(postElement, ".post-delete");

        const likeButton = querySelect(postElement, ".post-like");

        if (user) {
          const [outline, fill] = likeButton.querySelectorAll("path");
          if (likes.includes(user.reloadUserInfo.screenName)) {
            likeButton.classList.add("text-red-500");
            fill.classList.add("text-red-500");
            outline.classList.add("text-red-500");
            img.addEventListener("dblclick", () => {
              dislikePost(post.key, user.reloadUserInfo.screenName);
            });
            likeButton.addEventListener("click", () => {
              dislikePost(post.key, user.reloadUserInfo.screenName);
            });
          } else {
            fill.classList.add("text-white");
            outline.classList.add("text-transparent");
            img.addEventListener("dblclick", () => {
              likePost(post.key, user.reloadUserInfo.screenName);
            });
            likeButton.addEventListener("click", () => {
              likePost(post.key, user.reloadUserInfo.screenName);
            });
          }

          if (user.reloadUserInfo.screenName === post.authorID) {
            deleteButton.addEventListener("click", () => {
              confirm("Are you sure you want to delete this post?") && deletePostData(post.key);
            });
          }

          saveButton.addEventListener("click", () => {
            cachePost(post);
            cacheImage(post.resourceURL);
          });
        }

        home.appendChild(postElement);
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
  console.log("Saved");

  const posts = cacheData();
  console.log(posts);
  posts.map((post) => {
    appendNode(parent, "div", (postDiv) => {
      appendNode(postDiv, "div", (divv) => {
        divv.innerHTML = post.description;
      });
      cacheImageData(post.resourceURL).then((image) => {
        appendNode(postDiv, "div", function (imgDiv) {
          const img = document.createElement("img");
          img.src = URL.createObjectURL(image.blob);
          imgDiv.appendChild(img);
        });
      });
      appendNode(postDiv, "button", (divv) => {
        divv.innerHTML = "Borrar";
        divv.addEventListener("click", () => {
          uncachePost(post.id, post.resourceURL);
        });
      });
    });
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
        userImg.classList.add("rounded-full");
        createEffectWithLoggedIn((user) => {
          userImg.src = user.photoURL;
        });
      });

      appendNode(loggedIn, "div", (userNameDiv) => {
        createEffectWithLoggedIn((user) => {
          userNameDiv.innerHTML = `<b>Username:</b> @${getLinkGitHubUser(user.reloadUserInfo.screenName)}`;
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
