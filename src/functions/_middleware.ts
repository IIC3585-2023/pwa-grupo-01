interface Env {}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { pathname } = new URL(context.request.url);

  if (pathname.startsWith("/__/auth") && !pathname.includes(".")) {
    const response = await context.next();
    response.headers.set("Content-Type", "text/html");
    return response;
  }

  return context.next();
};
