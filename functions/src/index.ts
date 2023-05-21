import { onValueWritten } from "firebase-functions/v2/database";
import { initializeApp, database, messaging } from "firebase-admin";

const app = initializeApp();
const db = database(app);
const msg = messaging(app);

export const onLike = onValueWritten("posts/{postID}/likes/{userID}", async (event) => {
  const { postID, userID } = event.params;

  // Se obtiene el dueño del post
  const postRef = db.ref(`/posts/${postID}`);
  const postSnap = await postRef.once("value");
  if (!postSnap.exists()) {
    console.error(`Post ${postID} not found`);
    return;
  }
  const { authorUserName, description }: { authorUserName: string; description: string } = postSnap.val();

  // Se obtiene la lista de tokens del dueño
  const tokensRef = db.ref(`/users/${authorUserName}/tokens`);
  const tokensSnap = await tokensRef.once("value");
  if (!tokensSnap.exists()) {
    console.error(`No tokens found for user ${authorUserName}`);
    return;
  }
  const tokens: string[] = Object.values(tokensSnap.val());

  // Se envía la notificación
  await msg.sendEachForMulticast({
    tokens,
    notification: {
      title: `${userID} te dado like`,
      body: `${userID} te ha dado like en tu post de "${description}"`,
    },
  });
});
