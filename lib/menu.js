// lib/cmd/menu.js
import { Markup } from "telegraf";

export default function menu(bot) {
  bot.command("menu", async (ctx) => {
    await ctx.replyWithPhoto(
      { source: "assets/menu.jpg" }, // ✅ image, not video
      {
        caption: `📜 *BOT MENU*

🤖 AI
/gpt <text>
/chatbot on|off

⬇️ DOWNLOAD
/ytmp3 <url>
/ytmp4 <url>
/tiktok <url>
/instagram <url>
/facebook <url>
/gitclone <repo>

⚙️ INFO
/ping
/about
/runtime`,
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("🤖 AI", "MENU_AI")],
          [Markup.button.callback("⬇️ Download", "MENU_DL")],
          [Markup.button.callback("⚙️ Info", "MENU_INFO")]
        ])
      }
    );
  });
}
