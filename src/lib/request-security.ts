export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const allowedOrigins = [
    new URL(request.url).origin,
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, ""),
  ].filter(Boolean);

  return allowedOrigins.includes(origin);
}
