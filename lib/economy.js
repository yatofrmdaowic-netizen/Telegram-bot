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
      premiumUntil: 0
    };
  }

  const u = db.data.users[id];
  u.lastPremiumDaily ??= 0;
  u.premiumUntil ??= 0;
  return u;
}

function format(num) {
  return Number(num || 0).toLocaleString();
}

function cooldown(last, ms) {
  return Date.now() - last < ms;
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
  bot.command("balance", async (ctx) => {
    const u = getUser(ctx.from.id);
    await db.write();

    const premiumText = isPremium(u)
      ? `✅ Active (${formatDuration(remainingPremiumMs(u))} left)`
      : "❌ Not active";

    ctx.reply(
`💰 *Your Balance*
👛 Wallet: ${format(u.wallet)}
🏦 Bank: ${format(u.bank)}
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

  /* ===== DEPOSIT ===== */
  bot.command("deposit", async (ctx) => {
    const u = getUser(ctx.from.id);
    const amount = Number(ctx.message.text.split(" ")[1]);
    if (!amount || amount <= 0) return ctx.reply("❌ Usage: /deposit <amount>");
    if (u.wallet < amount) return ctx.reply("❌ Not enough wallet balance");

    u.wallet -= amount;
    u.bank += amount;
    await db.write();

    ctx.reply(`🏦 Deposited *${format(amount)}*`, { parse_mode: "Markdown" });
  });

  /* ===== WITHDRAW ===== */
  bot.command("withdraw", async (ctx) => {
    const u = getUser(ctx.from.id);
    const amount = Number(ctx.message.text.split(" ")[1]);
    if (!amount || amount <= 0) return ctx.reply("❌ Usage: /withdraw <amount>");
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
• boosted /daily reward
• /premiumdaily every 12h
• premium badge in /balance

Buy with:
/buypremium 7
/buypremium 30`,
      { parse_mode: "Markdown" }
    );
  });

  /* ===== BUY PREMIUM ===== */
  bot.command("buypremium", async (ctx) => {
    const u = getUser(ctx.from.id);
    const days = Number(ctx.message.text.split(" ")[1]);
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
