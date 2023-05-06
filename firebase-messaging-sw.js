self.addEventListener("push", (event) => {
  // Handle incoming push notification
  console.log("Push received: ", event);
});

// import { getMessaging } from "firebase/messaging/sw";
// import { onBackgroundMessage } from "firebase/messaging/sw";

// const messaging = getMessaging();
// onBackgroundMessage(messaging, (payload) => {
//   console.log("[firebase-messaging-sw.js] Received background message ", payload);
//   // Customize notification here
//   const notificationTitle = "Background Message Title";
//   const notificationOptions = {
//     body: "Background Message body.",
//     icon: "/firebase-logo.png",
//   };

//   self.registration.showNotification(notificationTitle, notificationOptions);
// });

importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js");

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

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message ", payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.image,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
