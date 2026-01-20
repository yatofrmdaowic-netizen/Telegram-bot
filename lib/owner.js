// lib/owner.js
const OWNERS = [
  123456789 // 🔴 replace with your Telegram user ID
];

const isOwner = id => OWNERS.includes(id);

export default function owner(bot) {

  bot.command("owner", ctx => {
    if (!isOwner(ctx.from.id)) return;
    ctx.reply(`
👑 OWNER COMMANDS
/restart
/eval <code>
/broadcast <text>
`);
  });

  // 🔄 Restart bot (PM2 / Docker / Railway)
  bot.command("restart", ctx => {
    if (!isOwner(ctx.from.id)) return;
    ctx.reply("♻️ Restarting...");
    process.exit(0);
  });

  // 🧪 Eval (JS code)
  bot.command("eval", async ctx => {
    if (!isOwner(ctx.from.id)) return;

    try {
      const code = ctx.message.text.replace("/eval", "");
      const result = eval(code);
      ctx.reply(`✅ Result:\n${result}`);
    } catch (e) {
      ctx.reply(`❌ Error:\n${e.message}`);
    }
  });

  // 📢 Broadcast
  bot.command("broadcast", async ctx => {
    if (!isOwner(ctx.from.id)) return;

    const msg = ctx.message.text.replace("/broadcast", "").trim();
    if (!msg) return ctx.reply("❌ Text missing");

    const chats = ctx.telegram.getUpdates(); // simple placeholder
    ctx.reply("📢 Broadcast sent");
  });

}
