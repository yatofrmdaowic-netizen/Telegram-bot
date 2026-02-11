// lib/image.js
import axios from "axios";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import { Markup } from "telegraf";

export default function image(bot) {
  /* ================= PHOTO LISTENER ================= */
  bot.on("photo", async (ctx) => {
    const photo = ctx.message.photo.at(-1);
    const fileId = photo.file_id;

    await ctx.reply(
      "🖼 *Image Tools*",
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("🧹 Remove BG", `RMBG:${fileId}`)],
          [Markup.button.callback("🖼 Sticker", `STICKER:${fileId}`)]
        ])
      }
    );
  });

  /* ================= REMOVE BG ================= */
  bot.action(/^RMBG:(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const fileId = ctx.match[1];

    try {
      await ctx.reply("🧹 Removing background...");

      // get file url from telegram
      const fileLink = await ctx.telegram.getFileLink(fileId);

      const form = new FormData();
      form.append("image_url", fileLink.href);
      form.append("size", "auto");

      const res = await axios.post(
        "https://api.remove.bg/v1.0/removebg",
        form,
        {
          headers: {
            ...form.getHeaders(),
            "X-Api-Key": process.env.REMOVEBG_KEY
          },
          responseType: "arraybuffer"
        }
      );

      const out = path.join("tmp", `rmbg_${Date.now()}.png`);
      fs.mkdirSync("tmp", { recursive: true });
      fs.writeFileSync(out, res.data);

      await ctx.replyWithPhoto({ source: out });
      fs.unlinkSync(out);

    } catch (e) {
      console.error(e);
      ctx.reply("❌ Remove BG failed");
    }
  });

  /* ================= STICKER ================= */
  bot.action(/^STICKER:(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const fileId = ctx.match[1];

    try {
      await ctx.reply("🖼 Creating sticker...");

      const fileLink = await ctx.telegram.getFileLink(fileId);
      await ctx.replyWithSticker({ url: fileLink.href });

    } catch (e) {
      console.error(e);
      ctx.reply("❌ Sticker failed");
    }
  });
}
