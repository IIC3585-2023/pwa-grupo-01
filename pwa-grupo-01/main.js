"use strict";

import { animateDomUpdate, createEffect, createSignal, appendNode, getElById, querySelect } from "./js/ui.js";
import { userSignal, logOut, signIn } from "./js/firebase/auth.js";
import { deletePostData, likePost, writePostData, postsData, dislikePost } from "./js/firebase/db.js";
import { getTimeAgo, getLinkGitHubUser, getSWVersion, versionSignal, waitForImageLoad } from "./js/utils.js";
import { initializeNotificationService, requestNotificationPermission, tokenSignal } from "./js/firebase/messaging.js";

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

// function replaceURL(path) {
//   const currentUrl = window.location.href;
//   const newUrl = currentUrl.replace(/\/$/, '/') + `#${path}`;
//   window.location.href = newUrl;
// }

const basePath = new URL(window.location.href).pathname;
const serviceWorkerUrl = `${basePath.replace(/\/+$/, "")}/sw.js`;

/** @typedef {(parent: HTMLElement) => void} PageComponent */

const postTemplate = /** @type {HTMLTemplateElement} */ (getElById("post-template"));
/** @type {PageComponent} */
function Home(parent) {
  appendNode(parent, "ul", (home) => {
    home.classList.add("flex", "flex-col", "items-center", "bg-black", "gap-4", "pb-24", "h-full");

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
        img.id = `img-${post.key}`;

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
          } else {
            deleteButton.remove();
          }
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
  const pageSignal = atachMainNavegation();
  atachCreatePost(pageSignal);
  atachUserImageInNav();
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

    contentEl.classList.remove("to-right", "to-left");
    oldPage = pageElement;
  });

  return page;
}

function atachUserImageInNav() {
  const img = /** @type {HTMLImageElement} */ (getElById("bar-user-img"));
  createEffectWithUser((user) => {
    document.documentElement.dataset["loggedin"] = String(!!user);
    img.src = user?.photoURL ?? "";
  });
}

/** @param {() => (typeof pages[0])} pageSignal */
function atachCreatePost(pageSignal) {
  const createBtn = /** @type {HTMLButtonElement} */ (getElById("create-btn"));

  createEffectWithUser((user) => {
    const { component } = pageSignal();
    const isDisabled = component !== Home || !user;
    createBtn.disabled = isDisabled;
  });

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
    animateDomUpdate(async () => {
      const postId = await writePostData(user?.reloadUserInfo, uploadCaption.value, img);
      uploadPreviewImg.classList.remove("new-post");
      closeDialog();
      post = /** @type {HTMLImageElement} */ (getElById("img-" + postId));
      if (post) {
        post.classList.add("new-post");
        await waitForImageLoad(post);
      }
    });
    if (!post) return;

    post.classList.remove("new-post");
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
