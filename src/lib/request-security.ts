export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    const requestUrl = new URL(request.url);
    const originUrl = new URL(origin);
    const configuredUrl = process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL) : null;
    const requestHost = (request.headers.get("x-forwarded-host") || request.headers.get("host"))?.split(":")[0];
    const originHost = originUrl.hostname;

    if (originUrl.origin === requestUrl.origin) return true;
    if (configuredUrl && originUrl.origin === configuredUrl.origin) return true;

    // Next can see an internal URL while the browser uses the LAN host.
    return Boolean(requestHost && originHost === requestHost);
  } catch {
    return false;
  }
}
