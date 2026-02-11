import { Markup } from "telegraf";

/* ================= CONFIG ================= */
const SPAM_LIMIT = 5;        // messages
const SPAM_INTERVAL = 5000; // ms (5 seconds)

/* ================= STORAGE ================= */
const antiLinkChats = new Set();
const antiSpamChats = new Set();
const spamTracker = new Map();

/* ================= HELPERS ================= */
async function isAdmin(ctx) {
  if (!ctx.chat || ctx.chat.type === "private") return true;
  try {
    const m = await ctx.telegram.getChatMember(
      ctx.chat.id,
      ctx.from.id
    );
    return ["administrator", "creator"].includes(m.status);
  } catch {
    return false;
  }
}

function hasLink(text = "") {
  return /(https?:\/\/|t\.me\/|www\.)/i.test(text);
}

/* ================= MAIN ================= */
export default function anti(bot) {

  /* ===== COMMANDS ===== */
  bot.command("antilink", async ctx => {
    if (!(await isAdmin(ctx))) return ctx.reply("🚫 Admin only");
    antiLinkChats.add(ctx.chat.id);
    ctx.reply("🚫 Anti‑Link ENABLED");
  });

  bot.command("antilinkoff", async ctx => {
    if (!(await isAdmin(ctx))) return ctx.reply("🚫 Admin only");
    antiLinkChats.delete(ctx.chat.id);
    ctx.reply("✅ Anti‑Link DISABLED");
  });

  bot.command("antispam", async ctx => {
    if (!(await isAdmin(ctx))) return ctx.reply("🚫 Admin only");
    antiSpamChats.add(ctx.chat.id);
    ctx.reply("🚨 Anti‑Spam ENABLED");
  });

  bot.command("antispamoff", async ctx => {
    if (!(await isAdmin(ctx))) return ctx.reply("🚫 Admin only");
    antiSpamChats.delete(ctx.chat.id);
    ctx.reply("✅ Anti‑Spam DISABLED");
  });

  /* ===== MESSAGE HANDLER ===== */
  bot.on("message", async ctx => {
    if (!ctx.chat || ctx.chat.type === "private") return;
    if (await isAdmin(ctx)) return;

    const text = ctx.message.text || "";

    /* ===== ANTI‑LINK ===== */
    if (antiLinkChats.has(ctx.chat.id) && hasLink(text)) {
      await ctx.deleteMessage().catch(() => {});
      return ctx.reply("🚫 Links are not allowed here");
    }

    /* ===== ANTI‑SPAM ===== */
    if (antiSpamChats.has(ctx.chat.id)) {
      const uid = ctx.from.id;
      const now = Date.now();

      if (!spamTracker.has(uid)) {
        spamTracker.set(uid, []);
      }

      const timestamps = spamTracker.get(uid)
        .filter(t => now - t < SPAM_INTERVAL);

      timestamps.push(now);
      spamTracker.set(uid, timestamps);

      if (timestamps.length >= SPAM_LIMIT) {
        await ctx.restrictChatMember(uid, {
          permissions: {},
          until_date: Math.floor((now + 60000) / 1000) // 1 min mute
        }).catch(() => {});
        spamTracker.delete(uid);
        return ctx.reply("🚨 Spamming detected! Muted for 1 minute");
      }
    }
  });

  console.log("🛡 Anti‑Link & Anti‑Spam loaded");
}
