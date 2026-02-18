import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

/* ================= DATABASE ================= */
const adapter = new JSONFile("database.json");
const defaultData = {
  users: {}
};
const db = new Low(adapter, defaultData);

await db.read();
db.data ||= defaultData;

/* ================= PREMIUM CONFIG ================= */
const PREMIUM_PRICES = {
  7: 15000,
  30: 50000
};

/* ================= HELPERS ================= */
function getUser(id) {
  if (!db.data.users[id]) {
    db.data.users[id] = {
      wallet: 500,
      bank: 0,
      lastBeg: 0,
      lastDaily: 0,
      lastPremiumDaily: 0,
      lastWork: 0,
      lastCrime: 0,
      premiumUntil: 0,
      lastPremiumPack: 0
    };
  }

  const u = db.data.users[id];
  u.lastPremiumDaily ??= 0;
  u.lastWork ??= 0;
  u.lastCrime ??= 0;
  u.premiumUntil ??= 0;
  u.lastPremiumPack ??= 0;
  return u;
}

function format(num) {
  return Number(num || 0).toLocaleString();
}

function cooldown(last, ms) {
  return Date.now() - last < ms;
}

function parseIntArg(ctx, index = 1) {
  const text = ctx?.message?.text || "";
  const parts = text.trim().split(/\s+/);
  const raw = parts[index];
  if (!raw) return null;

  const normalized = raw.toLowerCase() === "all" ? "all" : raw.replace(/,/g, "");
  if (normalized === "all") return "all";

  const value = Number(normalized);
  return Number.isFinite(value) ? Math.floor(value) : null;
}

function isPremium(user) {
  return (user.premiumUntil || 0) > Date.now();
}

function remainingPremiumMs(user) {
  return Math.max(0, (user.premiumUntil || 0) - Date.now());
}

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

/* ================= MAIN ================= */
export default function economy(bot) {
  /* ===== BALANCE ===== */
  bot.command(["balance", "bal"], async (ctx) => {
    const u = getUser(ctx.from.id);
    await db.write();

    const premiumText = isPremium(u)
      ? `✅ Active (${formatDuration(remainingPremiumMs(u))} left)`
      : "❌ Not active";

    ctx.reply(
`💰 *Your Balance*
👛 Wallet: ${format(u.wallet)}
🏦 Bank: ${format(u.bank)}
🧾 Net Worth: ${format(u.wallet + u.bank)}
💎 Premium: ${premiumText}`,
      { parse_mode: "Markdown" }
    );
  });

  /* ===== BEG ===== */
  bot.command("beg", async (ctx) => {
    const u = getUser(ctx.from.id);
    if (cooldown(u.lastBeg, 60_000)) {
      return ctx.reply("⏳ You can beg again in 1 minute");
    }

    const base = Math.floor(Math.random() * 200) + 50;
    const earn = isPremium(u) ? Math.floor(base * 1.5) : base;

    u.wallet += earn;
    u.lastBeg = Date.now();
    await db.write();

    ctx.reply(`🙏 You received *${format(earn)}* coins${isPremium(u) ? " (premium bonus)" : ""}`, {
      parse_mode: "Markdown"
    });
  });

  /* ===== WORK (NEW) ===== */
  bot.command("work", async (ctx) => {
    const u = getUser(ctx.from.id);
    if (cooldown(u.lastWork, 15 * 60_000)) {
      return ctx.reply("⏳ You can work again in 15 minutes");
    }

    const jobs = ["developer", "designer", "moderator", "driver", "chef", "editor"];
    const job = jobs[Math.floor(Math.random() * jobs.length)];

    const base = Math.floor(Math.random() * 900) + 300;
    const earn = isPremium(u) ? Math.floor(base * 1.25) : base;

    u.wallet += earn;
    u.lastWork = Date.now();
    await db.write();

    return ctx.reply(
      `💼 You worked as a *${job}* and earned *${format(earn)}* coins${isPremium(u) ? " (premium bonus)" : ""}`,
      { parse_mode: "Markdown" }
    );
  });

  /* ===== CRIME (NEW) ===== */
  bot.command("crime", async (ctx) => {
    const u = getUser(ctx.from.id);
    if (cooldown(u.lastCrime, 20 * 60_000)) {
      return ctx.reply("⏳ You can try /crime again in 20 minutes");
    }

    u.lastCrime = Date.now();

    const successChance = isPremium(u) ? 0.58 : 0.48;
    const success = Math.random() < successChance;

    if (success) {
      const reward = Math.floor(Math.random() * 1600) + 400;
      u.wallet += reward;
      await db.write();
      return ctx.reply(`🕶️ Crime succeeded. You stole *${format(reward)}* coins!`, {
        parse_mode: "Markdown"
      });
    }

    const currentWallet = Number(u.wallet || 0);
    const fine = Math.min(currentWallet, Math.floor(Math.random() * 900) + 200);
    u.wallet = Math.max(0, currentWallet - fine);
    await db.write();

    return ctx.reply(`🚨 You got caught and paid a fine of *${format(fine)}* coins.`, {
      parse_mode: "Markdown"
    });
  });

  /* ===== DAILY ===== */
  bot.command("daily", async (ctx) => {
    const u = getUser(ctx.from.id);
    if (cooldown(u.lastDaily, 86_400_000)) {
      return ctx.reply("⏳ Daily already claimed");
    }

    const reward = isPremium(u) ? 1800 : 1000;
    u.wallet += reward;
    u.lastDaily = Date.now();
    await db.write();

    ctx.reply(`🎁 Daily reward: *${format(reward)}* coins${isPremium(u) ? " (premium boosted)" : ""}`, {
      parse_mode: "Markdown"
    });
  });

  /* ===== PREMIUM DAILY ===== */
  bot.command("premiumdaily", async (ctx) => {
    const u = getUser(ctx.from.id);
    if (!isPremium(u)) {
      return ctx.reply("💎 Premium only command. Use /premium to see plans.");
    }
    if (cooldown(u.lastPremiumDaily, 43_200_000)) {
      return ctx.reply("⏳ Premium daily is available every 12 hours.");
    }

    const reward = Math.floor(Math.random() * 1500) + 1000;
    u.wallet += reward;
    u.lastPremiumDaily = Date.now();
    await db.write();

    ctx.reply(`💎 Premium daily claimed: *${format(reward)}* coins`, {
      parse_mode: "Markdown"
    });
  });


  /* ===== PREMIUM PACK ===== */
  bot.command("premiumpack", async (ctx) => {
    const u = getUser(ctx.from.id);
    if (!isPremium(u)) {
      return ctx.reply("💎 Premium only command. Use /premium to see plans.");
    }

    if (cooldown(u.lastPremiumPack, 86_400_000)) {
      return ctx.reply("⏳ Premium pack is available every 24 hours.");
    }

    const reward = Math.floor(Math.random() * 3500) + 1500;
    u.wallet += reward;
    u.lastPremiumPack = Date.now();
    await db.write();

    return ctx.reply(`🎁 Premium pack claimed: *${format(reward)}* coins`, {
      parse_mode: "Markdown"
    });
  });

  /* ===== DEPOSIT ===== */
  bot.command("deposit", async (ctx) => {
    const u = getUser(ctx.from.id);
    const amountArg = parseIntArg(ctx, 1);
    const amount = amountArg === "all" ? u.wallet : Number(amountArg);

    if (!amount || amount <= 0) return ctx.reply("❌ Usage: /deposit <amount|all>");
    if (u.wallet < amount) return ctx.reply("❌ Not enough wallet balance");

    u.wallet -= amount;
    u.bank += amount;
    await db.write();

    ctx.reply(`🏦 Deposited *${format(amount)}*`, { parse_mode: "Markdown" });
  });

  /* ===== WITHDRAW ===== */
  bot.command("withdraw", async (ctx) => {
    const u = getUser(ctx.from.id);
    const amountArg = parseIntArg(ctx, 1);
    const amount = amountArg === "all" ? u.bank : Number(amountArg);

    if (!amount || amount <= 0) return ctx.reply("❌ Usage: /withdraw <amount|all>");
    if (u.bank < amount) return ctx.reply("❌ Not enough bank balance");

    u.bank -= amount;
    u.wallet += amount;
    await db.write();

    ctx.reply(`🏧 Withdrawn *${format(amount)}*`, { parse_mode: "Markdown" });
  });

  /* ===== PREMIUM INFO ===== */
  bot.command("premium", (ctx) => {
    ctx.reply(
`💎 *PREMIUM PLANS*

7 days: *${format(PREMIUM_PRICES[7])}* coins
30 days: *${format(PREMIUM_PRICES[30])}* coins

*Benefits*
• +50% /beg rewards
• +25% /work rewards
• better /crime success chance
• boosted /daily reward
• /premiumdaily every 12h
• premium badge in /balance
• /premiumpack bonus every 24h

Buy with:
/buypremium 7
/buypremium 30`,
      { parse_mode: "Markdown" }
    );
  });

  /* ===== BUY PREMIUM ===== */
  bot.command("buypremium", async (ctx) => {
    const u = getUser(ctx.from.id);
    const days = Number(parseIntArg(ctx, 1));
    const price = PREMIUM_PRICES[days];

    if (!price) {
      return ctx.reply("❌ Usage: /buypremium <7|30>");
    }

    if (u.wallet < price) {
      return ctx.reply(`❌ Not enough wallet balance. Need ${format(price)} coins.`);
    }

    u.wallet -= price;
    const now = Date.now();
    const base = Math.max(now, u.premiumUntil || 0);
    u.premiumUntil = base + days * 24 * 60 * 60 * 1000;

    await db.write();

    ctx.reply(
      `✅ Premium activated for *${days} days*\n⏳ Expires in: *${formatDuration(remainingPremiumMs(u))}*`,
      { parse_mode: "Markdown" }
    );
  });

  /* ===== PREMIUM STATUS ===== */
  bot.command("premiumstatus", async (ctx) => {
    const u = getUser(ctx.from.id);
    await db.write();

    if (!isPremium(u)) {
      return ctx.reply("💎 Premium status: *Inactive*", { parse_mode: "Markdown" });
    }

    ctx.reply(
      `💎 Premium status: *Active*\n⏳ Time left: *${formatDuration(remainingPremiumMs(u))}*`,
      { parse_mode: "Markdown" }
    );
  });

  console.log("💰 Economy system loaded");
}
