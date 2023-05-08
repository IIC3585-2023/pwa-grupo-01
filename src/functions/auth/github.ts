// GitHub OAuth2 handler

interface Env {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = context.env;
  const { code } = await context.request.json<{ code: string }>();

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

  const data = await response.json<{ access_token: string }>();

  const homeUrl = new URL(context.request.url);
  homeUrl.pathname = "/";
  homeUrl.searchParams.set("access_token", data.access_token);

  return Response.redirect(homeUrl.toString());
};
