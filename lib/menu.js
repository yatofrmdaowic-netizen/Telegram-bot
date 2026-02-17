// lib/menu.js
import { Markup } from "telegraf";

async function sendMenu(ctx) {
  await ctx.replyWithPhoto(
    { source: "assets/menu.jpg" },
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
/runtime

💎 PREMIUM
/premium
/buypremium <7|30>
/premiumstatus
/premiumdaily`,
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("🤖 AI", "MENU_AI")],
        [Markup.button.callback("⬇️ Download", "MENU_DL")],
        [Markup.button.callback("⚙️ Info", "MENU_INFO")],
        [Markup.button.callback("💎 Premium", "MENU_PREMIUM")]
      ])
    }
  );
}

const menu = {
  start: async (ctx) => {
    await ctx.reply("👋 Welcome! Use /menu to view commands.");
    await sendMenu(ctx);
  },
  menu: sendMenu
};

export default menu;
