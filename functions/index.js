const functions = require("firebase-functions");
const fetch = require("node-fetch");

/**
 * @type {{
 *  github: { client_id: string, client_secret: string }
 * }}
 */
const { github } = functions.config();

exports.exchangeGitHubCodeForToken = functions.https.onCall(async (data, context) => {
  try {
    const code = data.code;

    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: github.client_id,
        client_secret: github.client_secret,
        code: code,
      }),
    });
    const { access_token } = await response.json();
    return { accessToken: access_token };
  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError("unauthenticated");
  }
});
