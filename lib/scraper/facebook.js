import engine from "./engine.js";

export async function scrapeFacebook(input) {
  const normalized = String(input || "").trim();
  if (!normalized) throw new Error("Facebook username/url is required");

  const url = normalized.startsWith("http")
    ? normalized
    : `https://www.facebook.com/${encodeURIComponent(normalized)}`;

  const res = await engine.request(url);
  const html = String(res.data || "");

  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const name = titleMatch?.[1]?.replace(/\s*\|\s*Facebook\s*$/i, "").trim();

  if (!name) throw new Error("Facebook profile not found");

  return {
    platform: "facebook",
    name,
    url
  };
}
