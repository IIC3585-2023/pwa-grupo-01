import { deletePostData, dislikePost, likePost } from "./firebase/db.js";
import { getElById, querySelect } from "./ui.js";
import { getLinkGitHubUser, getTimeAgo } from "./utils.js";
import { addPostToCache, removePostFromCache, isPostSavedInCache } from "../localDB.js";

const postTemplate = /** @type {HTMLTemplateElement} */ (getElById("post-template"));

export function renderPost(post, user, { isInSaved = false } = {}) {
  const likes = post?.likes ? Object.keys(post.likes) : [];
  const numLikes = likes.length;

  const postElement = /** @type {HTMLLIElement} */ (postTemplate.content.cloneNode(true));

  const ownerAvatar = /** @type {HTMLImageElement} */ (querySelect(postElement, ".post-owner-avatar"));
  ownerAvatar.src = `https://github.com/${post.authorUserName}.png`;

  const ownerName = querySelect(postElement, ".post-owner-name");
  ownerName.innerHTML = getLinkGitHubUser(post.authorUserName);

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

    if (user.reloadUserInfo.screenName === post.authorUserName) {
      deleteButton.addEventListener("click", () => {
        confirm("Are you sure you want to delete this post?") && deletePostData(post.key);
      });
    } else {
      deleteButton.remove();
    }

    const shouldShowRemoveOnSaved = isInSaved || isPostSavedInCache(post.key);

    const saveButton = querySelect(postElement, ".post-save");
    const addToCacheSVG = querySelect(saveButton, ".post-add-to-cache-svg");
    addToCacheSVG.classList.toggle("hidden", shouldShowRemoveOnSaved);
    const rmFromCacheSVG = querySelect(saveButton, ".post-rm-from-cache");
    rmFromCacheSVG.classList.toggle("hidden", !shouldShowRemoveOnSaved);

    if (shouldShowRemoveOnSaved) {
      saveButton.addEventListener("click", () => removePostFromCache(post));
    } else {
      saveButton.addEventListener("click", () => addPostToCache(post));
    }
  }

  return postElement;
}
