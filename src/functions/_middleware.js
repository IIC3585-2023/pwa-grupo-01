addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  if (request.url.endsWith("/__/auth/handler")) {
    const response = await fetch(request);
    const newHeaders = new Headers(response.headers);
    newHeaders.set("Content-Type", "text/html");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }

  return fetch(request);
}
