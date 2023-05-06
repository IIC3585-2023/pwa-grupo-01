import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GithubAuthProvider, onAuthStateChanged, signInWithPopup } from "firebase/auth";
import { getDatabase, ref as refDB, set, onValue } from "firebase/database";
import { getStorage, ref as refST, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
// import { onBackgroundMessage } from "firebase/messaging/sw";
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
let token = "";
getToken(messaging, { vapidKey: firebaseConfig.vapidKey })
  .then((currentToken) => {
    if (currentToken) {
      console.log("Token:", currentToken);
      token = currentToken;
      // Send the token to your server and update the UI if necessary
      // if (currentToken) {
      //   // Send a message to this device using FCM
      //   fetch('https://fcm.googleapis.com/fcm/send', {
      //     method: 'POST',
      //     headers: {
      //       'Content-Type': 'application/json',
      //       'Authorization': `key=BACoP15CznM-yVp9MApaloANUuUGHmEOWnaOI7tWTvbmQmklcW9EN2zN88UakQcMQAgIggsQMkumIOUh4Ybi1dw`
      //     },
      //     body: JSON.stringify({
      //       'to': "dv8Md-JU1zHXsrRqMSU2nj:APA91bG_vsEt5TSJpl3thXKHfYH1miXzDTVs3QMEC_gwMBWbX6faSQGyGBynog74AqIkYwivWT_K1WU0kKRWW1BK783Ue1P_du7EoSZZGDmuwA29UfY44bxG6qRmjhCKd04xfGguGJbi",
      //       'notification': {
      //         'title': 'New Notification',
      //         'body': 'Something happened!',
      //         'icon': 'https://example.com/icon.png'
      //       }
      //     })
      //   }).then((response) => {
      //     console.log('Notification sent:', response);
      //   }).catch((error) => {
      //     console.error('Error sending notification:', error);
      //   });
      // } else {
      //   console.warn('No registration token available.');
      // }
    } else {
      console.log("No registration token available. Request permission to generate one.");
    }
  })
  .catch((err) => {
    console.log("An error occurred while retrieving token. ", err);
  });

onMessage(messaging, (payload) => {
  console.log("Message received. ", payload);
  // ...
});
// onBackgroundMessage(messaging, (payload) => {
//   console.log('[firebase-messaging-sw.js] Received background message ', payload);
//   // Customize notification here
//   const notificationTitle = 'Background Message Title';
//   const notificationOptions = {
//     body: 'Background Message body.',
//     icon: '/firebase-logo.png'
//   };

//   self.registration.showNotification(notificationTitle,
//     notificationOptions);
// });
const provider = new GithubAuthProvider();
export const signIn = () => signInWithPopup(auth, provider);
export const logOut = () => auth.signOut();

export const [user, setUser] = /** @type {[() => User | null, (u: User | null) => void]} */ (
  createSignal(auth.currentUser)
);
onAuthStateChanged(auth, setUser);

export async function writePostData(authorInfo, description) {
  const postID = Date.now();
  const resourceURL = await uploadResource();
  console.log(resourceURL);
  set(refDB(db, "posts/" + postID), {
    authorID: authorInfo.screenName,
    authorImg: authorInfo.photoUrl,
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
  set(refDB(db, `posts/${postID}/likes/${userID}`), {
    userID,
  });
  // const notification = {
  //   title: "title",
  //   body: "message",
  // };
  // const payload = {
  //   notification: notification,
  //   token: token,
  // };
  // const options = {
  //   priority: "high",
  // };
  // messaging
  //   .send(payload, options)
  //   .then((response) => {
  //     console.log("Successfully sent message:", response);
  //   })
  //   .catch((error) => {
  //     console.error("Error sending message:", error);
  //   });
}

export async function dislikePost(postID, userID) {
  set(refDB(db, `posts/${postID}/likes/${userID}`), null);
}
