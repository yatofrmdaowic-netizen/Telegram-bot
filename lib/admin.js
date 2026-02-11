import { Markup } from "telegraf";

/* ================= HELPERS ================= */

async function isAdmin(ctx) {
  if (!ctx.chat || ctx.chat.type === "private") return false;
  try {
    const member = await ctx.telegram.getChatMember(
      ctx.chat.id,
      ctx.from.id
    );
    return ["administrator", "creator"].includes(member.status);
  } catch {
    return false;
  }
}

function getTarget(ctx) {
  return ctx.message?.reply_to_message?.from;
}

function parseTime(str) {
  // 10s | 5m | 2h | 1d
  const match = str?.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return null;
  const num = Number(match[1]);
  const unit = match[2];
  return (
    num *
    { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit]
  );
}

/* ================= STORAGE ================= */

const warns = {}; // { userId: count }
const MAX_WARNS = 3;

/* ================= MODULE ================= */

export default function admin(bot) {
  /* ===== ADMIN GUARD ===== */
  bot.use(async (ctx, next) => {
    if (ctx.chat?.type === "private") return next();
    if (!(await isAdmin(ctx))) {
      return ctx.reply("🚫 Admins only");
    }
    return next();
  });

  /* ===== KICK ===== */
  bot.command("kick", async ctx => {
    const u = getTarget(ctx);
    if (!u) return ctx.reply("❌ Reply to a user");
    await ctx.kickChatMember(u.id);
    ctx.reply("👢 User kicked");
  });

  /* ===== BAN ===== */
  bot.command("ban", async ctx => {
    const u = getTarget(ctx);
    if (!u) return ctx.reply("❌ Reply to a user");
    await ctx.banChatMember(u.id);
    ctx.reply("⛔ User banned");
  });

  /* ===== UNBAN ===== */
  bot.command("unban", async ctx => {
    const u = getTarget(ctx);
    if (!u) return ctx.reply("❌ Reply to a user");
    await ctx.unbanChatMember(u.id);
    ctx.reply("✅ User unbanned");
  });

  /* ===== MUTE ===== */
  bot.command("mute", async ctx => {
    const u = getTarget(ctx);
    if (!u) return ctx.reply("❌ Reply to a user");
    await ctx.restrictChatMember(u.id, { permissions: {} });
    ctx.reply("🔇 User muted");
  });

  /* ===== UNMUTE ===== */
  bot.command("unmute", async ctx => {
    const u = getTarget(ctx);
    if (!u) return ctx.reply("❌ Reply to a user");
    await ctx.restrictChatMember(u.id, {
      permissions: {
        can_send_messages: true,
        can_send_media_messages: true,
        can_send_other_messages: true,
        can_add_web_page_previews: true
      }
    });
    ctx.reply("🔊 User unmuted");
  });

  /* ===== TEMP MUTE ===== */
  bot.command("tempmute", async ctx => {
    const u = getTarget(ctx);
    const time = ctx.message.text.split(" ")[1];
    const ms = parseTime(time);

    if (!u || !ms)
      return ctx.reply("❌ Usage: /tempmute 10m (reply)");

    await ctx.restrictChatMember(u.id, {
      until_date: Math.floor((Date.now() + ms) / 1000),
      permissions: {}
    });

    ctx.reply(`⏱ Muted for ${time}`);
  });

  /* ===== WARN ===== */
  bot.command("warn", async ctx => {
    const u = getTarget(ctx);
    if (!u) return ctx.reply("❌ Reply to a user");

    warns[u.id] = (warns[u.id] || 0) + 1;

    ctx.reply(`⚠️ Warned (${warns[u.id]}/${MAX_WARNS})`);

    if (warns[u.id] >= MAX_WARNS) {
      await ctx.banChatMember(u.id);
      warns[u.id] = 0;
      ctx.reply("⛔ Auto‑banned (3 warns)");
    }
  });

  /* ===== LOCK CHAT ===== */
  bot.command("lock", async ctx => {
    await ctx.setChatPermissions({ can_send_messages: false });
    ctx.reply("🔒 Chat locked");
  });

  /* ===== UNLOCK CHAT ===== */
  bot.command("unlock", async ctx => {
    await ctx.setChatPermissions({
      can_send_messages: true,
      can_send_media_messages: true,
      can_send_other_messages: true
    });
    ctx.reply("🔓 Chat unlocked");
  });
}
