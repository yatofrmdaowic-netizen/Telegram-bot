import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

/* ================= DATABASE ================= */
const adapter = new JSONFile("database.json");
const defaultData = {
  users: {}
};
const db = new Low(adapter, defaultData);

// Top‑level await (Node 18+)
await db.read();
db.data ||= defaultData;

/* ================= HELPERS ================= */
function getUser(id) {
  if (!db.data.users[id]) {
    db.data.users[id] = {
      wallet: 500,
      bank: 0,
      lastBeg: 0,
      lastDaily: 0
    };
  }
  return db.data.users[id];
}

function format(num) {
  return num.toLocaleString();
}

function cooldown(last, ms) {
  return Date.now() - last < ms;
}

/* ================= MAIN ================= */
export default function economy(bot) {

  /* ===== BALANCE ===== */
  bot.command("balance", async (ctx) => {
    const u = getUser(ctx.from.id);
    await db.write();
    ctx.reply(
`💰 *Your Balance*
👛 Wallet: ${format(u.wallet)}
🏦 Bank: ${format(u.bank)}`,
      { parse_mode: "Markdown" }
    );
  });

  /* ===== BEG ===== */
  bot.command("beg", async (ctx) => {
    const u = getUser(ctx.from.id);
    if (cooldown(u.lastBeg, 60_000)) {
      return ctx.reply("⏳ You can beg again in 1 minute");
    }
    const earn = Math.floor(Math.random() * 200) + 50;
    u.wallet += earn;
    u.lastBeg = Date.now();
    await db.write();
    ctx.reply(`🙏 You received *${format(earn)}* coins`, {
      parse_mode: "Markdown"
    });
  });

  /* ===== DAILY ===== */
  bot.command("daily", async (ctx) => {
    const u = getUser(ctx.from.id);
    if (cooldown(u.lastDaily, 86_400_000)) {
      return ctx.reply("⏳ Daily already claimed");
    }
    const reward = 1000;
    u.wallet += reward;
    u.lastDaily = Date.now();
    await db.write();
    ctx.reply(`🎁 Daily reward: *${format(reward)}* coins`, {
      parse_mode: "Markdown"
    });
  });

  /* ===== DEPOSIT ===== */
  bot.command("deposit", async (ctx) => {
    const u = getUser(ctx.from.id);
    const amount = Number(ctx.message.text.split(" ")[1]);
    if (!amount || amount <= 0)
      return ctx.reply("❌ Usage: /deposit <amount>");
    if (u.wallet < amount)
      return ctx.reply("❌ Not enough wallet balance");
    u.wallet -= amount;
    u.bank += amount;
    await db.write();
    ctx.reply(`🏦 Deposited *${format(amount)}*`, {
      parse_mode: "Markdown"
    });
  });

  /* ===== WITHDRAW ===== */
  bot.command("withdraw", async (ctx) => {
    const u = getUser(ctx.from.id);
    const amount = Number(ctx.message.text.split(" ")[1]);
    if (!amount || amount <= 0)
      return ctx.reply("❌ Usage: /withdraw <amount>");
    if (u.bank < amount)
      return ctx.reply("❌ Not enough bank balance");
    u.bank -= amount;
    u.wallet += amount;
    await db.write();
    ctx.reply(`🏧 Withdrawn *${format(amount)}*`, {
      parse_mode: "Markdown"
    });
  });

  console.log("💰 Economy system loaded");
}
    ctx.reply(`🙏 You got ${earn}`);
  });

}
