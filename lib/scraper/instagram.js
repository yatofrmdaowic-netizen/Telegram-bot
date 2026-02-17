import engine from "./engine.js";

export async function scrapeInstagram(input) {
  const normalized = String(input || "").replace(/^@/, "").trim();
  if (!normalized) throw new Error("Instagram username is required");

  const url = `https://www.instagram.com/${encodeURIComponent(normalized)}/?__a=1&__d=dis`;
  const res = await engine.request(url);
  const user = res.data?.graphql?.user;

  if (!user) throw new Error("Instagram profile not found or private");

  return {
    platform: "instagram",
    username: user.username,
    fullName: user.full_name,
    biography: user.biography,
    followers: user.edge_followed_by?.count ?? 0,
    following: user.edge_follow?.count ?? 0,
    posts: user.edge_owner_to_timeline_media?.count ?? 0,
    profilePic: user.profile_pic_url_hd || user.profile_pic_url,
    verified: Boolean(user.is_verified),
    private: Boolean(user.is_private)
  };
}
