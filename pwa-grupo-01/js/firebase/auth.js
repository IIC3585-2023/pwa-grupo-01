import {
  getAuth,
  GithubAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signInWithCredential,
} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-functions.js";
import { createSignal } from "../ui.js";
import { app } from "./app.js";

const auth = getAuth(app);
const functions = getFunctions(app);
const clientId = "c02f64cb4421420f69d8";

const githubProvider = new GithubAuthProvider();
export const signIn = () => signInWithPopup(auth, githubProvider);
export const logOut = () => auth.signOut();

export const [user, setUser] = /** @type {[() => User | null, (u: User | null) => void]} */ (
  createSignal(auth.currentUser)
);
onAuthStateChanged(auth, setUser);

export function signInUrl() {
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", window.location.href);
  url.searchParams.set("scope", "user:email");
  return url.toString();
}

const exchangeGitHubCodeForToken = httpsCallable(functions, "exchangeGitHubCodeForToken");
export async function handleAuthTokenFromGitHub() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  if (code) {
    const result = /** @type {import("firebase/functions").HttpsCallableResult<{ accessToken: string }>} */ (
      await exchangeGitHubCodeForToken({ code })
    );
    const accessToken = result.data.accessToken;
    const credential = GithubAuthProvider.credential(accessToken);
    await signInWithCredential(auth, credential);
  }
}
