import {
  getStorage,
  ref as refST,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-storage.js";
import { getDatabase, ref as refDB, set as setDB, onValue } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-database.js";
import { createSignal } from "../ui.js";

import { app } from "./app.js";

const db = getDatabase(app);
const storage = getStorage(app);

/**
 * @param {any} authorInfo
 * @param {string} description
 */
export async function writePostData(authorInfo, description) {
  const postID = Date.now();
  const resourceURL = await uploadResource();
  console.log(resourceURL);
  setDB(refDB(db, "posts/" + postID), {
    authorID: authorInfo.screenName,
    authorImg: authorInfo.photoUrl,
    description,
    resourceURL,
  });
}

/** @param {File} file */
export const getUniqueName = (file) => {
  console.log(file);
  const parts = file.name.split(".");
  const extension = parts.slice(-1)[0];
  const filename = parts.slice(0, -1).join(".");
  const id = Date.now();
  return `${filename}-${id}.${extension}`;
};

function uploadResource() {
  const file = document.getElementById("upload-img-input")?.files[0];
  const uniqueName = getUniqueName(file);
  const metadata = { contentType: file.type };
  const storageRef = refST(storage, uniqueName);
  return uploadBytes(storageRef, file, metadata)
    .then(() => getDownloadURL(storageRef))
    .then((url) => {
      console.log("File available at", url);
      return url;
    });
}

const [postsData, setPostsData] = createSignal([]);
const starCountRef = refDB(db, "posts");
onValue(starCountRef, (snapshot) => {
  const data = snapshot.val();
  const sortedPosts = Object.entries(data)
    .sort(([keyA], [keyB]) => keyB.localeCompare(keyA))
    .map(([key, value]) => ({ key, ...value }));
  setPostsData(sortedPosts);
});

export { postsData };

export async function deletePostData(postID) {
  deleteResource(postID);
  setDB(refDB(db, "posts/" + postID), null);
}

export function getOnePost(postID) {
  const starCountRef = refDB(db, "posts/" + postID);
  let postData = [];
  onValue(starCountRef, (snapshot) => {
    const data = snapshot.val();
    postData = data;
  });
  return postData;
}

function deleteResource(postID) {
  const post = getOnePost(postID);
  const url = post?.resourceURL;
  const storageRef = refST(storage, url);
  return deleteObject(storageRef);
}

export async function likePost(postID, userID) {
  setDB(refDB(db, `posts/${postID}/likes/${userID}`), {
    userID,
  });
}

export async function dislikePost(postID, userID) {
  setDB(refDB(db, `posts/${postID}/likes/${userID}`), null);
}
