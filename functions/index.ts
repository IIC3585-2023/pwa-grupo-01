/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}

async function getCode(request: Request) {
  try {
    const data = await request.json<{ code: string }>();
    if (!data.code) throw new Error("No code provided");
    return data.code;
  } catch (error) {
    throw new Error("Invalid request body");
  }
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const code = await getCode(request);
    const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = env;

    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code: code,
      }),
    });

    const { access_token } = await response.json<{ access_token: string }>();
    return Response.redirect(
    return Response.json({ accessToken: access_token });
  },
};
