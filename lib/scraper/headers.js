const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/537.36 Chrome/119 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/118 Safari/537.36"
];

export function getHeaders(cookie = "") {
  const ua = userAgents[Math.floor(Math.random() * userAgents.length)];

  return {
    "User-Agent": ua,
    "Accept": "text/html,application/json",
    "Accept-Language": "en-US,en;q=0.9",
    "Connection": "keep-alive",
    ...(cookie && { Cookie: cookie })
  };
}
