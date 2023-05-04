import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth, GithubAuthProvider, signInWithPopup, onAuthStateChanged, signInWithRedirect } from "firebase/auth";
import { getDatabase, ref as refDB, set, onValue } from "firebase/database";
import { getStorage, ref as refST, uploadBytes, getDownloadURL } from "firebase/storage";
import { createSignal, createEffect } from "./js/ui.js";
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
  measurementId: "G-YB7Z7VGX4W"
};


// Initialize Firebase
export const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GithubAuthProvider();
export const signIn = () => signInWithRedirect(auth, provider);
export const logOut = () => auth.signOut();


export const [user, setUser] = /** @type {[() => User | null, (u: User | null) => void]} */ (createSignal(auth.currentUser));
onAuthStateChanged(auth, setUser);

export async function writePostData(authorID, descripion) {
  //generar ID unico
  const postID = Date.now();
  const url = await uploadResource();
  console.log(url)
  const db = getDatabase();
  set(refDB(db, 'posts/' + postID), {
    authorID,
    descripion,
    url
  });
}

export function uploadResource() {
  const storage = getStorage();

  const file = document.getElementById('upload-img-input')?.files[0];
  const uniqueName = getUniqueName(file)
  const metadata = { contentType: file.type };

  const storageRef = refST(storage, uniqueName);
  return uploadBytes(storageRef, file, metadata)
    .then(() => getDownloadURL(storageRef))
    .then((url) => {
      console.log('File available at', url);
      return url;
    })
}


const [postsData, setPostsData] = createSignal([])
const db = getDatabase();
const starCountRef = refDB(db, 'posts');
onValue(starCountRef, (snapshot) => {
  const data = snapshot.val();
  setPostsData(Object.values(data))
});

export { postsData }


// @benjavicente mira lo funcional de esta funcion
const getUniqueName = (file) => {
  console.log(file)
  const parts = file.name.split('.')
  const extension = parts.slice(-1)[0]
  const filename = parts.slice(0, -1).join('.')
  const id = Date.now()
  return `${filename}-${id}.${extension}`
}



// const analytics = getAnalytics(app);

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

