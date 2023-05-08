import {
  getAuth,
  GithubAuthProvider,
  signInWithPopup,
  signInWithCredential,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";
import { createSignal } from "../ui.js";
import { app } from "./app.js";

const auth = getAuth(app);

const githubProvider = new GithubAuthProvider();
export const signIn = () => signInWithPopup(auth, githubProvider);
export const logOut = () => auth.signOut();

export const [user, setUser] = /** @type {[() => User | null, (u: User | null) => void]} */ (
  createSignal(auth.currentUser)
);

const clientId = "c02f64cb4421420f69d8";

export function signInUrl() {
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", window.location.href);
  url.searchParams.set("scope", "user:email");
  return url.toString();
}

export function handleAccessToken() {
  const url = new URL(window.location.href);
  const token = url.searchParams.get("access_token");
  if (!token) return;

  const credential = GithubAuthProvider.credential(token);
  signInWithCredential(auth, credential);
}

onAuthStateChanged(auth, setUser);
