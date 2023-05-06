import { getMessaging } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-messaging.js";
import { app } from "./app.js";

export const messaging = getMessaging(app);
