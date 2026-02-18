import { Markup } from "telegraf";

/* ================= HELPERS ================= */

async function isAdmin(ctx) {
  if (!ctx.chat || ctx.chat.type === "private") return false;
  try {
    const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
    return ["administrator", "creator"].includes(member.status);
  } catch {
    return false;
  }
}

async function isBotAdmin(ctx) {
  if (!ctx.chat || ctx.chat.type === "private") return false;
  try {
    const me = await ctx.telegram.getMe();
    const member = await ctx.telegram.getChatMember(ctx.chat.id, me.id);
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
  return num * { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit];
}

function parseCommand(ctx) {
  const text = ctx?.message?.text || "";
  if (!text.startsWith("/")) return "";
  const raw = text.slice(1).split(/\s+/)[0];
  return raw.split("@")[0].toLowerCase();
}

function getReason(ctx, from = 2) {
  const text = ctx?.message?.text || "";
  const parts = text.trim().split(/\s+/);
  return parts.slice(from).join(" ").trim();
}

function chatWarnKey(chatId, userId) {
  return `${chatId}:${userId}`;
}

async function guardAction(ctx, requireBotAdmin = true) {
  if (!ctx.chat || ctx.chat.type === "private") {
    await ctx.reply("❌ This command only works in groups.");
    return false;
  }

  if (!(await isAdmin(ctx))) {
    await ctx.reply("🚫 Admins only");
    return false;
  }

  if (requireBotAdmin && !(await isBotAdmin(ctx))) {
    await ctx.reply("🤖 I need admin rights to do that.");
    return false;
  }

  return true;
}

/* ================= STORAGE ================= */

const warns = {}; // { "chatId:userId": count }
const MAX_WARNS = 3;

const ADMIN_COMMANDS = new Set([
  "kick",
  "ban",
  "unban",
  "mute",
  "unmute",
  "tempmute",
  "warn",
  "warns",
  "clearwarns",
  "lock",
  "unlock",
  "pin",
  "unpin",
  "purge",
  "adminhelp"
]);

/* ================= MODULE ================= */

export default function admin(bot) {
  /* ===== ADMIN GUARD (commands only) ===== */
  bot.use(async (ctx, next) => {
    const cmd = parseCommand(ctx);
    if (!ADMIN_COMMANDS.has(cmd)) return next();

    if (!ctx.chat || ctx.chat.type === "private") {
      await ctx.reply("❌ Admin commands are only for groups.");
      return;
    }

    if (!(await isAdmin(ctx))) {
      await ctx.reply("🚫 Admins only");
      return;
    }

    return next();
  });

  /* ===== ADMIN HELP (NEW) ===== */
  bot.command("adminhelp", async (ctx) => {
    if (!(await guardAction(ctx, false))) return;

    await ctx.reply(
`🛡 *ADMIN COMMANDS*
/kick *(reply)*
/ban *(reply)*
/unban *(reply)*
/mute *(reply)*
/unmute *(reply)*
/tempmute <10m|1h|1d> *(reply)*
/warn [reason] *(reply)*
/warns *(reply)*
/clearwarns *(reply)*
/lock
/unlock
/pin *(reply)*
/unpin
/purge <count> *(reply to a recent message)*`,
      { parse_mode: "Markdown" }
    );
  });

  /* ===== KICK ===== */
  bot.command("kick", async (ctx) => {
    if (!(await guardAction(ctx))) return;

    const u = getTarget(ctx);
    if (!u) return ctx.reply("❌ Reply to a user");

    await ctx.kickChatMember(u.id);
    const reason = getReason(ctx);
    ctx.reply(`👢 User kicked${reason ? `\n📝 Reason: ${reason}` : ""}`);
  });

  /* ===== BAN ===== */
  bot.command("ban", async (ctx) => {
    if (!(await guardAction(ctx))) return;

    const u = getTarget(ctx);
    if (!u) return ctx.reply("❌ Reply to a user");

    await ctx.banChatMember(u.id);
    const reason = getReason(ctx);
    ctx.reply(`⛔ User banned${reason ? `\n📝 Reason: ${reason}` : ""}`);
  });

  /* ===== UNBAN ===== */
  bot.command("unban", async (ctx) => {
    if (!(await guardAction(ctx))) return;

    const u = getTarget(ctx);
    if (!u) return ctx.reply("❌ Reply to a user");

    await ctx.unbanChatMember(u.id);
    ctx.reply("✅ User unbanned");
  });

  /* ===== MUTE ===== */
  bot.command("mute", async (ctx) => {
    if (!(await guardAction(ctx))) return;

    const u = getTarget(ctx);
    if (!u) return ctx.reply("❌ Reply to a user");

    await ctx.restrictChatMember(u.id, { permissions: {} });
    const reason = getReason(ctx);
    ctx.reply(`🔇 User muted${reason ? `\n📝 Reason: ${reason}` : ""}`);
  });

  /* ===== UNMUTE ===== */
  bot.command("unmute", async (ctx) => {
    if (!(await guardAction(ctx))) return;

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
  bot.command("tempmute", async (ctx) => {
    if (!(await guardAction(ctx))) return;

    const u = getTarget(ctx);
    const time = ctx.message.text.split(" ")[1];
    const ms = parseTime(time);

    if (!u || !ms) return ctx.reply("❌ Usage: /tempmute 10m (reply)");

    await ctx.restrictChatMember(u.id, {
      until_date: Math.floor((Date.now() + ms) / 1000),
      permissions: {}
    });

    const reason = getReason(ctx, 2);
    ctx.reply(`⏱ Muted for ${time}${reason ? `\n📝 Reason: ${reason}` : ""}`);
  });

  /* ===== WARN ===== */
  bot.command("warn", async (ctx) => {
    if (!(await guardAction(ctx, false))) return;

    const u = getTarget(ctx);
    if (!u) return ctx.reply("❌ Reply to a user");

    const key = chatWarnKey(ctx.chat.id, u.id);
    warns[key] = (warns[key] || 0) + 1;
    const reason = getReason(ctx);

    await ctx.reply(
      `⚠️ Warned *${u.first_name || "user"}* (${warns[key]}/${MAX_WARNS})${reason ? `\n📝 Reason: ${reason}` : ""}`,
      { parse_mode: "Markdown" }
    );

    if (warns[key] >= MAX_WARNS) {
      if (!(await isBotAdmin(ctx))) {
        return ctx.reply("⚠️ Reached max warns but I need admin rights to auto-ban.");
      }

      await ctx.banChatMember(u.id);
      warns[key] = 0;
      ctx.reply("⛔ Auto‑banned (3 warns)");
    }
  });

  /* ===== WARNS COUNT (NEW) ===== */
  bot.command("warns", async (ctx) => {
    if (!(await guardAction(ctx, false))) return;

    const u = getTarget(ctx);
    if (!u) return ctx.reply("❌ Reply to a user");

    const key = chatWarnKey(ctx.chat.id, u.id);
    const count = warns[key] || 0;

    return ctx.reply(`📌 Warns for ${u.first_name || "user"}: *${count}/${MAX_WARNS}*`, {
      parse_mode: "Markdown"
    });
  });

  /* ===== CLEAR WARNS (NEW) ===== */
  bot.command("clearwarns", async (ctx) => {
    if (!(await guardAction(ctx, false))) return;

    const u = getTarget(ctx);
    if (!u) return ctx.reply("❌ Reply to a user");

    const key = chatWarnKey(ctx.chat.id, u.id);
    warns[key] = 0;

    return ctx.reply("✅ User warns cleared.");
  });

  /* ===== LOCK CHAT ===== */
  bot.command("lock", async (ctx) => {
    if (!(await guardAction(ctx))) return;

    await ctx.setChatPermissions({ can_send_messages: false });
    ctx.reply("🔒 Chat locked");
  });

  /* ===== UNLOCK CHAT ===== */
  bot.command("unlock", async (ctx) => {
    if (!(await guardAction(ctx))) return;

    await ctx.setChatPermissions({
      can_send_messages: true,
      can_send_media_messages: true,
      can_send_other_messages: true
    });
    ctx.reply("🔓 Chat unlocked");
  });

  /* ===== PIN (NEW) ===== */
  bot.command("pin", async (ctx) => {
    if (!(await guardAction(ctx))) return;

    const messageId = ctx.message?.reply_to_message?.message_id;
    if (!messageId) return ctx.reply("❌ Reply to a message to pin it.");

    await ctx.pinChatMessage(messageId, { disable_notification: true });
    ctx.reply("📌 Message pinned");
  });

  /* ===== UNPIN (NEW) ===== */
  bot.command("unpin", async (ctx) => {
    if (!(await guardAction(ctx))) return;

    await ctx.unpinAllChatMessages();
    ctx.reply("📍 All pinned messages were unpinned");
  });

  /* ===== PURGE (NEW) ===== */
  bot.command("purge", async (ctx) => {
    if (!(await guardAction(ctx))) return;

    const replyMsgId = ctx.message?.reply_to_message?.message_id;
    const count = Number(ctx.message.text.split(/\s+/)[1]);

    if (!replyMsgId || !Number.isFinite(count) || count < 1 || count > 100) {
      return ctx.reply("❌ Usage: /purge <1-100> (reply to a recent message)");
    }

    let deleted = 0;
    for (let i = 0; i < count; i += 1) {
      try {
        await ctx.deleteMessage(replyMsgId + i);
        deleted += 1;
      } catch {
        // ignore missing/non-deletable messages
      }
    }

    await ctx.reply(`🧹 Purged *${deleted}* messages.`, { parse_mode: "Markdown" });
  });

  /* ===== ADMIN QUICK ACTIONS (NEW) ===== */
  bot.action("ADMIN_HELP", async (ctx) => {
    await ctx.answerCbQuery("Use /adminhelp in group chat");
  });

  bot.command("adminpanel", async (ctx) => {
    if (!(await guardAction(ctx, false))) return;

    await ctx.reply(
      "🛡 Admin quick panel",
      Markup.inlineKeyboard([
        [Markup.button.callback("Help", "ADMIN_HELP")],
        [Markup.button.callback("Lock tip", "ADMIN_HELP")]
      ])
    );
  });
}
