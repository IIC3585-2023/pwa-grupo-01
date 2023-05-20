import {
  getAuth,
  GithubAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";
import { createSignal } from "../ui.js";
import { app } from "./app.js";

const auth = getAuth(app);

const githubProvider = new GithubAuthProvider();
export const signIn = () => signInWithPopup(auth, githubProvider);
export const logOut = () => auth.signOut();

export const [userSignal, setUser] = /** @type {[() => User | null, (u: User | null) => void]} */ (createSignal(auth.currentUser));
onAuthStateChanged(auth, setUser);
