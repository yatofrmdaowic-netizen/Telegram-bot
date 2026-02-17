import engine from "./engine.js";

export async function scrapeTikTok(input) {
  const normalized = String(input || "").replace(/^@/, "").trim();
  if (!normalized) throw new Error("TikTok username is required");

  const url = `https://www.tiktok.com/@${encodeURIComponent(normalized)}`;
  const res = await engine.request(url);
  const html = String(res.data || "");

  const sigiMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!sigiMatch?.[1]) {
    throw new Error("Unable to parse TikTok profile");
  }

  const payload = JSON.parse(sigiMatch[1]);
  const users = payload?.__DEFAULT_SCOPE__?.["webapp.user-detail"]?.userInfo;
  const user = users?.user;
  const stats = users?.stats;

  if (!user) throw new Error("TikTok profile not found");

  return {
    platform: "tiktok",
    username: user.uniqueId,
    nickname: user.nickname,
    followers: stats?.followerCount ?? 0,
    following: stats?.followingCount ?? 0,
    likes: stats?.heartCount ?? 0,
    videos: stats?.videoCount ?? 0,
    profilePic: user.avatarLarger || user.avatarMedium || user.avatarThumb,
    verified: Boolean(user.verified)
  };
}
