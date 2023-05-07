import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";

export const firebaseConfig = {
  apiKey: "AIzaSyAUStWhQDubms1kFSaoW6SduSxaUHiUZqY",
  authDomain: "pwagag.pages.dev",
  projectId: "pwgag-eed34",
  storageBucket: "pwgag-eed34.appspot.com",
  datebaseURL: "https://pwgag-eed34-default-rtdb.firebaseio.com/",
  messagingSenderId: "575919704777",
  appId: "1:575919704777:web:e98775f6118a166edf5b18",
  measurementId: "G-YB7Z7VGX4W",
  vapidKey: "BACoP15CznM-yVp9MApaloANUuUGHmEOWnaOI7tWTvbmQmklcW9EN2zN88UakQcMQAgIggsQMkumIOUh4Ybi1dw",
};

export const app = initializeApp(firebaseConfig);
