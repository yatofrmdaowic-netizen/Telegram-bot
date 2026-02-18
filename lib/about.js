import os from "os";

const startTime = Date.now();

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

export default function about(bot) {
  bot.command("about", async (ctx) => {
    const uptime = formatUptime(Date.now() - startTime);

    await ctx.reply(
`🤖 *TELEGRAM MULTI‑BOT*

👑 *Owner:* ${process.env.OWNER_NAME || "Limplimp"}
⚙️ *Language:* Node.js (ESM)
🧠 *AI:* OpenAI SDK
📦 *Framework:* Telegraf v4
🖥 *Platform:* ${os.platform()} (${os.arch()})

✨ *Features*
• 🤖 AI Chat & Images  
• 🎬 Media Downloaders  
• 💰 Economy System  
• 🛡 Admin & Group Tools  
• 🔘 Inline Menus & Buttons  
• 💎 Premium System  

⏱ *Uptime:* ${uptime}
📜 *License:* MIT
🚀 *Status:* Online & Stable ✅`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "📜 Menu", callback_data: "MENU_MAIN" },
              { text: "⚙️ Ping", callback_data: "ABOUT_PING" }
            ],
            [
              { text: "👑 Owner", url: "https://t.me/Limplimp" }
            ]
          ]
        }
      }
    );
  });

  // Optional callback
  bot.action("ABOUT_PING", async (ctx) => {
    await ctx.answerCbQuery("🏓 Bot is alive!");
  });
}
