// lib/owner.js
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

/* ================= OWNER CHECK ================= */
const OWNERS = [
  String(process.env.CREATOR_ID),
  String(process.env.OWNER_ID)
].filter(Boolean);

const isOwner = (id) => OWNERS.includes(String(id));

/* ================= DATABASE ================= */
const adapter = new JSONFile("database.json");
const db = new Low(adapter, { users: {} });
await db.read();
db.data ||= { users: {} };

function getUser(id) {
  db.data.users[id] ||= {
    wallet: 500,
    bank: 0,
    lastBeg: 0,
    lastDaily: 0,
    lastPremiumDaily: 0,
    premiumUntil: 0
  };
  db.data.users[id].premiumUntil ??= 0;
  return db.data.users[id];
}

/* ================= SIMPLE USER STORE ================= */
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
💎 PREMIUM
/addpremium <user_id> <days>
/removepremium <user_id>
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
        result = `${result.slice(0, 4000)}\n…truncated`;
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

  /* ================= ADD PREMIUM ================= */
  bot.command("addpremium", async (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);

    const [, targetId, daysArg] = ctx.message.text.split(" ");
    const days = Number(daysArg || "0");

    if (!targetId || !days || days <= 0) {
      return ctx.reply("❌ Usage: /addpremium <user_id> <days>");
    }

    const user = getUser(targetId);
    const base = Math.max(Date.now(), user.premiumUntil || 0);
    user.premiumUntil = base + days * 24 * 60 * 60 * 1000;
    await db.write();

    ctx.reply(`✅ Premium added for user ${targetId} (${days} days).`);
  });

  /* ================= REMOVE PREMIUM ================= */
  bot.command("removepremium", async (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);

    const [, targetId] = ctx.message.text.split(" ");
    if (!targetId) {
      return ctx.reply("❌ Usage: /removepremium <user_id>");
    }

    const user = getUser(targetId);
    user.premiumUntil = 0;
    await db.write();

    ctx.reply(`✅ Premium removed for user ${targetId}.`);
  });

  /* ================= OWNER STATS ================= */
  bot.command("ownerstats", (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);

    const premiumCount = Object.values(db.data.users || {}).filter(
      (u) => (u.premiumUntil || 0) > Date.now()
    ).length;

    ctx.reply(
`📊 *OWNER STATS*
👥 Known users: ${knownUsers.size}
👑 Owners: ${OWNERS.length}
💎 Premium users: ${premiumCount}
🤖 Bot: Online`,
      { parse_mode: "Markdown" }
    );
  });

  console.log("👑 Owner system loaded");
}
