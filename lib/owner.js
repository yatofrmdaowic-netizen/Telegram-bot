// lib/owner.js
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

/* ================= OWNER CHECK ================= */
const OWNERS = [String(process.env.CREATOR_ID), String(process.env.OWNER_ID)].filter(Boolean);

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

function parseCommandParts(ctx) {
  const text = ctx?.message?.text || "";
  return text.trim().split(/\s+/);
}

function parsePositiveInt(raw) {
  const value = Number(String(raw || "").replace(/,/g, ""));
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.floor(value);
}

function format(num) {
  return Number(num || 0).toLocaleString();
}

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
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

  const deny = (ctx) => ctx.reply("⛔ *Owner only command*", { parse_mode: "Markdown" });

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
/premiumlist
💰 ECONOMY
/addcoins <user_id> <amount>
/setbalance <user_id> <wallet> [bank]
📊 INFO
/ownerstats
/userinfo <user_id>`,
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
      } catch {
        // ignored by design
      }
    }

    ctx.reply(`📢 Broadcast sent to *${sent} users*`, {
      parse_mode: "Markdown"
    });
  });

  /* ================= ADD PREMIUM ================= */
  bot.command("addpremium", async (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);

    const [, targetId, daysArg] = parseCommandParts(ctx);
    const days = parsePositiveInt(daysArg);

    if (!targetId || !days) {
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

    const [, targetId] = parseCommandParts(ctx);
    if (!targetId) {
      return ctx.reply("❌ Usage: /removepremium <user_id>");
    }

    const user = getUser(targetId);
    user.premiumUntil = 0;
    await db.write();

    ctx.reply(`✅ Premium removed for user ${targetId}.`);
  });

  /* ================= PREMIUM LIST (NEW) ================= */
  bot.command("premiumlist", async (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);

    const now = Date.now();
    const premiumRows = Object.entries(db.data.users || {})
      .filter(([, u]) => (u.premiumUntil || 0) > now)
      .sort((a, b) => (b[1].premiumUntil || 0) - (a[1].premiumUntil || 0))
      .slice(0, 25)
      .map(([id, u], i) => `${i + 1}. \`${id}\` - ${formatDuration((u.premiumUntil || 0) - now)}`);

    if (!premiumRows.length) {
      return ctx.reply("💎 No active premium users right now.");
    }

    return ctx.reply(`💎 *Premium Users (Top ${premiumRows.length})*\n\n${premiumRows.join("\n")}`, {
      parse_mode: "Markdown"
    });
  });

  /* ================= ADD COINS (NEW) ================= */
  bot.command("addcoins", async (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);

    const [, targetId, amountArg] = parseCommandParts(ctx);
    const amount = parsePositiveInt(amountArg);

    if (!targetId || !amount) {
      return ctx.reply("❌ Usage: /addcoins <user_id> <amount>");
    }

    const user = getUser(targetId);
    user.wallet += amount;
    await db.write();

    return ctx.reply(`✅ Added *${format(amount)}* coins to user ${targetId}.`, {
      parse_mode: "Markdown"
    });
  });

  /* ================= SET BALANCE (NEW) ================= */
  bot.command("setbalance", async (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);

    const [, targetId, walletArg, bankArg] = parseCommandParts(ctx);
    const wallet = parsePositiveInt(walletArg);
    const bank = bankArg ? parsePositiveInt(bankArg) : 0;

    if (!targetId || wallet === null || (bankArg && bank === null)) {
      return ctx.reply("❌ Usage: /setbalance <user_id> <wallet> [bank]");
    }

    const user = getUser(targetId);
    user.wallet = wallet;
    user.bank = bank;
    await db.write();

    return ctx.reply(
      `✅ Balance updated for ${targetId}.\n👛 Wallet: *${format(wallet)}*\n🏦 Bank: *${format(bank)}*`,
      { parse_mode: "Markdown" }
    );
  });

  /* ================= USER INFO (NEW) ================= */
  bot.command("userinfo", async (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);

    const [, targetId] = parseCommandParts(ctx);
    if (!targetId) {
      return ctx.reply("❌ Usage: /userinfo <user_id>");
    }

    const user = getUser(targetId);
    const premiumMs = Math.max(0, (user.premiumUntil || 0) - Date.now());

    await db.write();

    return ctx.reply(
`🧾 *USER INFO*
🆔 ID: \`${targetId}\`
👛 Wallet: *${format(user.wallet)}*
🏦 Bank: *${format(user.bank)}*
💰 Net Worth: *${format((user.wallet || 0) + (user.bank || 0))}*
💎 Premium: *${premiumMs > 0 ? `Active (${formatDuration(premiumMs)} left)` : "Inactive"}*`,
      { parse_mode: "Markdown" }
    );
  });

  /* ================= OWNER STATS ================= */
  bot.command("ownerstats", (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);

    const users = Object.values(db.data.users || {});
    const premiumCount = users.filter((u) => (u.premiumUntil || 0) > Date.now()).length;
    const totalWallet = users.reduce((sum, u) => sum + Number(u.wallet || 0), 0);
    const totalBank = users.reduce((sum, u) => sum + Number(u.bank || 0), 0);

    ctx.reply(
`📊 *OWNER STATS*
👥 Known users: ${knownUsers.size}
👑 Owners: ${OWNERS.length}
💎 Premium users: ${premiumCount}
👛 Total wallet coins: ${format(totalWallet)}
🏦 Total bank coins: ${format(totalBank)}
🤖 Bot: Online`,
      { parse_mode: "Markdown" }
    );
  });

  console.log("👑 Owner system loaded");
}
