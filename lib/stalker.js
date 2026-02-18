import { scrapeInstagram } from "./scraper/instagram.js";
import { scrapeTikTok } from "./scraper/tiktok.js";
import { scrapeFacebook } from "./scraper/facebook.js";

function parseArg(ctx) {
  return ctx.message.text.split(" ").slice(1).join(" ").trim();
}

export default function stalker(bot) {
  bot.command("igstalk", async (ctx) => {
    const username = parseArg(ctx);
    if (!username) return ctx.reply("Usage: /igstalk <username>");

    try {
      await ctx.reply("🔎 Checking Instagram profile...");
      const d = await scrapeInstagram(username);
      await ctx.replyWithPhoto(d.profilePic, {
        caption:
          `📸 *Instagram Stalk*\n` +
          `👤 @${d.username}\n` +
          `📛 ${d.fullName || "-"}\n` +
          `👥 Followers: ${d.followers}\n` +
          `➡ Following: ${d.following}\n` +
          `📦 Posts: ${d.posts}\n` +
          `✔ Verified: ${d.verified ? "Yes" : "No"}\n` +
          `🔒 Private: ${d.private ? "Yes" : "No"}\n\n` +
          `📝 Bio:\n${d.biography || "-"}`,
        parse_mode: "Markdown"
      });
    } catch {
      ctx.reply("❌ Profile not found / private");
    }
  });

  bot.command("tiktokstalk", async (ctx) => {
    const username = parseArg(ctx);
    if (!username) return ctx.reply("Usage: /tiktokstalk <username>");

    try {
      await ctx.reply("🔎 Checking TikTok profile...");
      const d = await scrapeTikTok(username);
      const caption =
        `🎵 *TikTok Stalk*\n` +
        `👤 ${d.nickname || "-"}\n` +
        `🔗 @${d.username}\n` +
        `👥 Followers: ${d.followers}\n` +
        `➡ Following: ${d.following}\n` +
        `❤️ Likes: ${d.likes}\n` +
        `🎬 Videos: ${d.videos}\n` +
        `✔ Verified: ${d.verified ? "Yes" : "No"}`;

      if (d.profilePic) {
        await ctx.replyWithPhoto(d.profilePic, { caption, parse_mode: "Markdown" });
      } else {
        await ctx.reply(caption, { parse_mode: "Markdown" });
      }
    } catch {
      ctx.reply("❌ Profile not found");
    }
  });

  bot.command("xstalk", (ctx) => {
    ctx.reply("⚠️ X/Twitter stalk is currently unavailable in this build.");
  });

  bot.command("facebookstalk", async (ctx) => {
    const usernameOrUrl = parseArg(ctx);
    if (!usernameOrUrl) return ctx.reply("Usage: /facebookstalk <username|url>");

    try {
      await ctx.reply("🔎 Checking Facebook profile...");
      const d = await scrapeFacebook(usernameOrUrl);
      await ctx.reply(
        `📘 *Facebook Stalk*\n👤 ${d.name}\n🔗 ${d.url}\n⚠️ Public info only`,
        { parse_mode: "Markdown" }
      );
    } catch {
      ctx.reply("❌ Profile not found");
    }
  });
}
