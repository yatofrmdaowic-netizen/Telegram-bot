// lib/owner.js

/* ================= OWNER CHECK ================= */
const OWNERS = [
  String(process.env.CREATOR_ID),
  String(process.env.OWNER_ID)
].filter(Boolean);

const isOwner = (id) => OWNERS.includes(String(id));

/* ================= SIMPLE USER STORE =================
   ⚠️ Replace with DB later if needed
====================================================== */
const knownUsers = new Set();

/* ================= EXPORT ================= */
export default function owner(bot) {
  /* ===== TRACK USERS ===== */
  bot.use((ctx, next) => {
    if (ctx.from?.id) knownUsers.add(ctx.from.id);
    return next();
  });

  const deny = (ctx) =>
    ctx.reply("⛔ *Owner only command*", { parse_mode: "Markdown" });

  /* ================= OWNER PANEL ================= */
  bot.command("owner", (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);
    ctx.reply(
`👑 *OWNER PANEL*
🛠 SYSTEM
/restart
/eval <code>
📢 GLOBAL
/broadcast <text>
📊 INFO
/ownerstats`,
      { parse_mode: "Markdown" }
    );
  });

  /* ================= RESTART ================= */
  bot.command("restart", async (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);
    await ctx.reply("♻️ Restarting bot...");
    setTimeout(() => process.exit(0), 500);
  });

  /* ================= SAFE EVAL ================= */
  bot.command("eval", async (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);

    const code = ctx.message.text.replace("/eval", "").trim();
    if (!code) return ctx.reply("❌ No code provided");

    try {
      let result = await eval(`(async () => { ${code} })()`);
      if (typeof result !== "string") {
        result = JSON.stringify(result, null, 2);
      }
      if (result.length > 4000) {
        result = result.slice(0, 4000) + "\n…truncated";
      }
      ctx.reply(`✅ *RESULT*\n\`\`\`js\n${result}\n\`\`\``, {
        parse_mode: "Markdown"
      });
    } catch (e) {
      ctx.reply(`❌ *ERROR*\n\`\`\`\n${e.message}\n\`\`\``, {
        parse_mode: "Markdown"
      });
    }
  });

  /* ================= BROADCAST ================= */
  bot.command("broadcast", async (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);

    const text = ctx.message.text.replace("/broadcast", "").trim();
    if (!text) return ctx.reply("❌ Text missing");

    let sent = 0;
    for (const uid of knownUsers) {
      try {
        await bot.telegram.sendMessage(uid, `📢 *BROADCAST*\n\n${text}`, {
          parse_mode: "Markdown"
        });
        sent++;
      } catch {}
    }

    ctx.reply(`📢 Broadcast sent to *${sent} users*`, {
      parse_mode: "Markdown"
    });
  });

  /* ================= OWNER STATS ================= */
  bot.command("ownerstats", (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);
    ctx.reply(
`📊 *OWNER STATS*
👥 Known users: ${knownUsers.size}
👑 Owners: ${OWNERS.length}
🤖 Bot: Online`,
      { parse_mode: "Markdown" }
    );
  });

  console.log("👑 Owner system loaded");
}
