// lib/instagramPublic.js
import axios from "axios";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36";

async function fetchPublicProfile(username) {
  try {
    const url = `https://www.instagram.com/${username}/?__a=1&__d=dis`;

    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
      },
      timeout: 10000,
    });

    const user = data?.graphql?.user;
    if (!user) throw new Error("User not found or private");

    return {
      username: user.username,
      fullName: user.full_name,
      bio: user.biography,
      followers: user.edge_followed_by.count,
      following: user.edge_follow.count,
      posts: user.edge_owner_to_timeline_media.count,
      profilePic: user.profile_pic_url_hd || user.profile_pic_url,
      verified: user.is_verified,
      private: user.is_private,
    };
  } catch (err) {
    throw new Error("Failed to fetch public profile");
  }
}

export default function instagramPublic(bot) {
  bot.command("igpublic", async (ctx) => {
    const username = ctx.message.text.split(" ")[1];
    if (!username) {
      return ctx.reply("Usage: /igpublic <username>");
    }

    try {
      await ctx.reply("🔎 Fetching public profile...");

      const data = await fetchPublicProfile(username);

      const text = `
📸 *Instagram Public Profile*

👤 Username: ${data.username}
🏷 Full Name: ${data.fullName || "-"}
📝 Bio: ${data.bio || "-"}
👥 Followers: ${data.followers}
➡ Following: ${data.following}
📦 Posts: ${data.posts}
✔ Verified: ${data.verified ? "Yes" : "No"}
🔒 Private: ${data.private ? "Yes" : "No"}
`;

      await ctx.replyWithPhoto(data.profilePic, {
        caption: text,
        parse_mode: "Markdown",
      });
    } catch (e) {
      ctx.reply("❌ Profile not found or private.");
    }
  });

  console.log("📸 Instagram public reader loaded");
}
