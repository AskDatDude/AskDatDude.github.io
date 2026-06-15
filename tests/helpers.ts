export function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function textResponse(value: string, status = 200): Response {
  return new Response(value, {
    status,
    headers: { "Content-Type": "text/plain" },
  });
}
