export default function about(bot) {
  bot.command("about", (ctx) => {
    ctx.reply(
`🤖 *Telegram Multi‑Bot*

👑 Owner: Limplimp  
⚙️ Language: Node.js (Telegraf)  
🧠 AI: OpenAI  
📦 Features:
• AI Chat & Images
• Media Downloads
• Economy System
• Admin Tools
• Inline Buttons

📜 License: MIT  
🚀 Status: Online & Stable`,
      { parse_mode: "Markdown" }
    );
  });
}
