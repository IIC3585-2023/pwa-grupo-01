import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GithubAuthProvider, signInWithPopup, onAuthStateChanged, signInWithRedirect } from "firebase/auth";
import { getDatabase, ref as refDB, set, onValue } from "firebase/database";
import { getStorage, ref as refST, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { createSignal, createEffect } from "./js/ui.js";
import { getUniqueName } from "./js/utils.js";
/** @typedef {import("firebase/auth").User} User */

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAUStWhQDubms1kFSaoW6SduSxaUHiUZqY",
  authDomain: "pwgag-eed34.firebaseapp.com",
  projectId: "pwgag-eed34",
  storageBucket: "pwgag-eed34.appspot.com",
  datebaseURL: "https://pwgag-eed34-default-rtdb.firebaseio.com/",
  messagingSenderId: "575919704777",
  appId: "1:575919704777:web:e98775f6118a166edf5b18",
  measurementId: "G-YB7Z7VGX4W",
  vapidKey: "BACoP15CznM-yVp9MApaloANUuUGHmEOWnaOI7tWTvbmQmklcW9EN2zN88UakQcMQAgIggsQMkumIOUh4Ybi1dw",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);
const db = getDatabase(app);
const storage = getStorage(app);
const messaging = getMessaging(app);
function requestPermission() {
  console.log("Requesting permission...");
  Notification.requestPermission().then((permission) => {
    if (permission === "granted") {
      console.log("Notification permission granted.");
    }
  });
}
requestPermission();
getToken(messaging, { vapidKey: firebaseConfig.vapidKey })
  .then((currentToken) => {
    if (currentToken) {
      console.log(currentToken);
      // Send the token to your server and update the UI if necessary
      // ...
    } else {
      // Show permission request UI
      console.log("No registration token available. Request permission to generate one.");
      // ...
    }
  })
  .catch((err) => {
    console.log("An error occurred while retrieving token. ", err);
    // ...
  });

onMessage(messaging, (payload) => {
  console.log("Message received. ", payload);
  // ...
});
const provider = new GithubAuthProvider();
export const signIn = () => signInWithRedirect(auth, provider);
export const logOut = () => auth.signOut();

export const [user, setUser] = /** @type {[() => User | null, (u: User | null) => void]} */ (
  createSignal(auth.currentUser)
);
onAuthStateChanged(auth, setUser);

export async function writePostData(authorID, description) {
  const postID = Date.now();
  const resourceURL = await uploadResource();
  console.log(resourceURL);
  set(refDB(db, "posts/" + postID), {
    authorID,
    description,
    resourceURL,
  });
}

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
  set(refDB(db, "posts/" + postID), null);
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
  console.log(postID, userID);
  const post = getOnePost(postID);
  set(refDB(db, `posts/${postID}/likes/${userID}`), {
    userID,
  });
}

export async function dislikePost(postID, userID) {
  console.log(postID, userID);
  const post = getOnePost(postID);
  set(refDB(db, `posts/${postID}/likes/${userID}`), null);
}

// signInWithPopup(auth, provider)
//   .then((result) => {
//     // This gives you a GitHub Access Token. You can use it to access the GitHub API.
//     const credential = GithubAuthProvider.credentialFromResult(result);
//     const token = credential.accessToken;

//     // The signed-in user info.
//     const user = result.user;
//     console.log(user);
//     // IdP data available using getAdditionalUserInfo(result)
//     // ...
//   }).catch((error) => {
//     // Handle Errors here.
//     const errorCode = error.code;
//     const errorMessage = error.message;
//     // The email of the user's account used.
//     const email = error.customData.email;
//     // The AuthCredential type that was used.
//     const credential = GithubAuthProvider.credentialFromError(error);
//     // ...
//   });
