import { instagramStalk } from "./instagram.js";
import { tiktokStalk } from "./tiktok.js";
import { twitterStalk } from "./twitter.js";
import { facebookStalk } from "./facebook.js";

export default function stalker(bot) {

  bot.command("igstalk", async ctx => {
    const u = ctx.message.text.split(" ")[1];
    if (!u) return ctx.reply("Usage: /igstalk <username>");
    try {
      const d = await instagramStalk(u);
      await ctx.replyWithPhoto(
        { url: d.profilePic },
`📸 *Instagram Stalk*
👤 @${d.username}
📛 ${d.name}
👥 Followers: ${d.followers}
📝 Bio:
${d.bio}`,
        { parse_mode: "Markdown" }
      );
    } catch {
      ctx.reply("❌ Profile not found / private");
    }
  });

  bot.command("tiktokstalk", async ctx => {
    const u = ctx.message.text.split(" ")[1];
    if (!u) return ctx.reply("Usage: /tiktokstalk <username>");
    try {
      const d = await tiktokStalk(u);
      ctx.reply(
`🎵 *TikTok Stalk*
👤 ${d.name}
🔗 @${d.username}
👥 Followers: ${d.followers}
❤️ Likes: ${d.likes}
🎬 Videos: ${d.videos}`,
        { parse_mode: "Markdown" }
      );
    } catch {
      ctx.reply("❌ Profile not found");
    }
  });

  bot.command("xstalk", async ctx => {
    const u = ctx.message.text.split(" ")[1];
    if (!u) return ctx.reply("Usage: /xstalk <username>");
    try {
      const d = await twitterStalk(u);
      ctx.reply(
`🐦 *X Stalk*
👤 ${d.name}
👥 Followers: ${d.followers}
📝 Posts: ${d.tweets}`,
        { parse_mode: "Markdown" }
      );
    } catch {
      ctx.reply("❌ Profile not found");
    }
  });

  bot.command("facebookstalk", async ctx => {
    const u = ctx.message.text.split(" ")[1];
    if (!u) return ctx.reply("Usage: /facebookstalk <username>");
    try {
      const d = await facebookStalk(u);
      ctx.reply(
`📘 *Facebook Stalk*
👤 ${d.name}
⚠️ Public info only`,
        { parse_mode: "Markdown" }
      );
    } catch {
      ctx.reply("❌ Profile not found");
    }
  });
}
