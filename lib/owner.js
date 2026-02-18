// lib/owner.js
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

/* ================= OWNER CHECK ================= */
const OWNERS = [String(process.env.CREATOR_ID), String(process.env.OWNER_ID)].filter(Boolean);
const isOwner = (id) => OWNERS.includes(String(id));

/* ================= DATABASE ================= */
const adapter = new JSONFile("database.json");
const db = new Low(adapter, {
  users: {},
  suspendedUsers: {},
  channels: [],
  bannedChannels: {},
  reportedAccounts: {},
  reportedChannels: {}
});
await db.read();
db.data ||= {
  users: {},
  suspendedUsers: {},
  channels: [],
  bannedChannels: {},
  reportedAccounts: {},
  reportedChannels: {}
};
db.data.users ||= {};
db.data.suspendedUsers ||= {};
db.data.channels ||= [];
db.data.bannedChannels ||= {};
db.data.reportedAccounts ||= {};
db.data.reportedChannels ||= {};

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

function parseNonNegativeInt(raw) {
  const value = Number(String(raw || "").replace(/,/g, ""));
  if (!Number.isFinite(value) || value < 0) return null;
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

function resolveTargetId(ctx, parts, index = 1) {
  const fromArgs = parts[index];
  if (fromArgs) return String(fromArgs);

  const replyId = ctx?.message?.reply_to_message?.from?.id;
  if (replyId) return String(replyId);

  return null;
}

function normalizeChannelId(raw) {
  if (!raw) return null;
  const value = String(raw).trim();
  if (!value) return null;
  if (!/^@?[A-Za-z0-9_\-]+$/.test(value)) return null;
  return value.startsWith("@") ? value.toLowerCase() : `@${value.toLowerCase()}`;
}

function getSuspendRecord(id) {
  return db.data.suspendedUsers[String(id)] || null;
}

function getChannelKeyFromCtx(ctx) {
  const username = ctx?.chat?.username;
  if (username) return `@${String(username).toLowerCase()}`;

  const id = ctx?.chat?.id;
  if (id) return String(id);

  return null;
}

function pushReport(bucket, target, payload) {
  bucket[target] ||= [];
  bucket[target].push(payload);
  if (bucket[target].length > 20) {
    bucket[target] = bucket[target].slice(-20);
  }
}

/* ================= SIMPLE USER STORE ================= */
const knownUsers = new Set();

/* ================= EXPORT ================= */
export default function owner(bot) {
  /* ===== TRACK USERS + ACCOUNT/CHANNEL BAN GUARD ===== */
  bot.use((ctx, next) => {
    const uid = ctx.from?.id;
    if (uid) knownUsers.add(uid);

    const channelKey = getChannelKeyFromCtx(ctx);
    if (channelKey && db.data.bannedChannels[channelKey]) {
      return ctx.reply("⛔ This channel is banned from using this bot.");
    }

    if (!uid || isOwner(uid)) return next();

    const suspended = getSuspendRecord(uid);
    if (!suspended) return next();

    if (suspended.until && Date.now() > suspended.until) {
      delete db.data.suspendedUsers[String(uid)];
      db.write().catch(() => {});
      return next();
    }

    const reason = suspended.reason ? `\nReason: ${suspended.reason}` : "";
    const untilText = suspended.until ? `\nUntil: ${new Date(suspended.until).toISOString()}` : "\nDuration: Permanent";
    return ctx.reply(`⛔ Your account is suspended from using this bot.${reason}${untilText}`);
  });

  const deny = (ctx) => ctx.reply("⛔ *Owner only command*", { parse_mode: "Markdown" });

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
/removecoins <user_id> <amount>
/setbalance <user_id> <wallet> [bank]
/resetuser <user_id>
🚫 ACCOUNT BAN
/suspend <user_id> [hours] [reason]
/unsuspend <user_id>
/banaccount <user_id> [reason]
/unbanaccount <user_id>
/suspendlist
📝 REPORTS
/reportaccount <user_id> [reason]
/reportchannel <@channel> [reason]
/accountreports
/channelreports
/clearreport <account|channel> <target>
📣 CHANNEL CONTROL
/addchannel <@channel>
/removechannel <@channel>
/channellist
/banchannel <@channel> [reason]
/unbanchannel <@channel>
/bannedchannels
📊 INFO
/topusers [count]
/ownerstats
/userinfo <user_id>`,
      { parse_mode: "Markdown" }
    );
  });

  bot.command("restart", async (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);
    await ctx.reply("♻️ Restarting bot...");
    setTimeout(() => process.exit(0), 500);
  });

  bot.command("eval", async (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);

    const code = ctx.message.text.replace("/eval", "").trim();
    if (!code) return ctx.reply("❌ No code provided");

    try {
      let result = await eval(`(async () => { ${code} })()`);
      if (typeof result !== "string") result = JSON.stringify(result, null, 2);
      if (result.length > 4000) result = `${result.slice(0, 4000)}\n…truncated`;
      ctx.reply(`✅ *RESULT*\n\`\`\`js\n${result}\n\`\`\``, { parse_mode: "Markdown" });
    } catch (e) {
      ctx.reply(`❌ *ERROR*\n\`\`\`\n${e.message}\n\`\`\``, { parse_mode: "Markdown" });
    }
  });

  bot.command("broadcast", async (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);

    const text = ctx.message.text.replace("/broadcast", "").trim();
    if (!text) return ctx.reply("❌ Text missing");

    let usersSent = 0;
    for (const uid of knownUsers) {
      try {
        await bot.telegram.sendMessage(uid, `📢 *BROADCAST*\n\n${text}`, { parse_mode: "Markdown" });
        usersSent++;
      } catch {
        // ignore delivery errors
      }
    }

    let channelsSent = 0;
    for (const channel of db.data.channels) {
      if (db.data.bannedChannels[channel]) continue;
      try {
        await bot.telegram.sendMessage(channel, `📢 *BROADCAST*\n\n${text}`, { parse_mode: "Markdown" });
        channelsSent++;
      } catch {
        // ignore delivery errors
      }
    }

    ctx.reply(`📢 Broadcast sent to *${usersSent} users* and *${channelsSent} channels*`, {
      parse_mode: "Markdown"
    });
  });

  bot.command("addpremium", async (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);
    const parts = parseCommandParts(ctx);
    const targetId = resolveTargetId(ctx, parts);
    const days = parsePositiveInt(parts[2]);
    if (!targetId || !days) return ctx.reply("❌ Usage: /addpremium <user_id> <days>");

    const user = getUser(targetId);
    const base = Math.max(Date.now(), user.premiumUntil || 0);
    user.premiumUntil = base + days * 24 * 60 * 60 * 1000;
    await db.write();
    return ctx.reply(`✅ Premium added for user ${targetId} (${days} days).`);
  });

  bot.command("removepremium", async (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);
    const targetId = resolveTargetId(ctx, parseCommandParts(ctx));
    if (!targetId) return ctx.reply("❌ Usage: /removepremium <user_id>");

    const user = getUser(targetId);
    user.premiumUntil = 0;
    await db.write();
    return ctx.reply(`✅ Premium removed for user ${targetId}.`);
  });

  bot.command("premiumlist", async (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);

    const now = Date.now();
    const premiumRows = Object.entries(db.data.users || {})
      .filter(([, u]) => (u.premiumUntil || 0) > now)
      .sort((a, b) => (b[1].premiumUntil || 0) - (a[1].premiumUntil || 0))
      .slice(0, 25)
      .map(([id, u], i) => `${i + 1}. \`${id}\` - ${formatDuration((u.premiumUntil || 0) - now)}`);

    if (!premiumRows.length) return ctx.reply("💎 No active premium users right now.");

    return ctx.reply(`💎 *Premium Users (Top ${premiumRows.length})*\n\n${premiumRows.join("\n")}`, {
      parse_mode: "Markdown"
    });
  });

  bot.command("addcoins", async (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);
    const parts = parseCommandParts(ctx);
    const targetId = resolveTargetId(ctx, parts);
    const amount = parsePositiveInt(parts[2]);
    if (!targetId || !amount) return ctx.reply("❌ Usage: /addcoins <user_id> <amount>");

    const user = getUser(targetId);
    user.wallet += amount;
    await db.write();
    return ctx.reply(`✅ Added *${format(amount)}* coins to user ${targetId}.`, { parse_mode: "Markdown" });
  });

  bot.command("removecoins", async (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);
    const parts = parseCommandParts(ctx);
    const targetId = resolveTargetId(ctx, parts);
    const amount = parsePositiveInt(parts[2]);
    if (!targetId || !amount) return ctx.reply("❌ Usage: /removecoins <user_id> <amount>");

    const user = getUser(targetId);
    user.wallet = Math.max(0, Number(user.wallet || 0) - amount);
    await db.write();
    return ctx.reply(`✅ Removed *${format(amount)}* coins from user ${targetId}.`, { parse_mode: "Markdown" });
  });

  bot.command("setbalance", async (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);

    const [, targetId, walletArg, bankArg] = parseCommandParts(ctx);
    const wallet = parseNonNegativeInt(walletArg);
    const bank = bankArg ? parseNonNegativeInt(bankArg) : 0;
    if (!targetId || wallet === null || (bankArg && bank === null)) {
      return ctx.reply("❌ Usage: /setbalance <user_id> <wallet> [bank]");
    }

    const user = getUser(targetId);
    user.wallet = wallet;
    user.bank = bank;
    await db.write();

    return ctx.reply(`✅ Balance updated for ${targetId}.\n👛 Wallet: *${format(wallet)}*\n🏦 Bank: *${format(bank)}*`, {
      parse_mode: "Markdown"
    });
  });

  bot.command("userinfo", async (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);

    const targetId = resolveTargetId(ctx, parseCommandParts(ctx));
    if (!targetId) return ctx.reply("❌ Usage: /userinfo <user_id>");

    const user = getUser(targetId);
    const premiumMs = Math.max(0, (user.premiumUntil || 0) - Date.now());
    const suspended = getSuspendRecord(targetId);

    await db.write();

    return ctx.reply(
`🧾 *USER INFO*
🆔 ID: \`${targetId}\`
👛 Wallet: *${format(user.wallet)}*
🏦 Bank: *${format(user.bank)}*
💰 Net Worth: *${format((user.wallet || 0) + (user.bank || 0))}*
💎 Premium: *${premiumMs > 0 ? `Active (${formatDuration(premiumMs)} left)` : "Inactive"}*
🚫 Suspended: *${suspended ? "Yes" : "No"}*`,
      { parse_mode: "Markdown" }
    );
  });

  bot.command("resetuser", async (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);

    const targetId = resolveTargetId(ctx, parseCommandParts(ctx));
    if (!targetId) return ctx.reply("❌ Usage: /resetuser <user_id>");

    db.data.users[targetId] = {
      wallet: 500,
      bank: 0,
      lastBeg: 0,
      lastDaily: 0,
      lastPremiumDaily: 0,
      premiumUntil: 0
    };
    await db.write();

    return ctx.reply(`✅ User ${targetId} has been reset to default economy values.`);
  });

  /* ================= ACCOUNT BAN CONTROLS ================= */
  bot.command("suspend", async (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);

    const parts = parseCommandParts(ctx);
    const targetId = resolveTargetId(ctx, parts);
    const maybeHours = parsePositiveInt(parts[2]);
    const reasonStart = maybeHours ? 3 : 2;
    const reason = parts.slice(reasonStart).join(" ").trim();
    const until = maybeHours ? Date.now() + maybeHours * 60 * 60 * 1000 : 0;

    if (!targetId) return ctx.reply("❌ Usage: /suspend <user_id> [hours] [reason]");
    if (isOwner(targetId)) return ctx.reply("❌ You cannot suspend an owner account.");

    db.data.suspendedUsers[String(targetId)] = {
      by: String(ctx.from.id),
      reason: reason || "No reason provided",
      suspendedAt: Date.now(),
      until
    };
    await db.write();

    const untilText = until ? new Date(until).toISOString() : "Permanent";
    return ctx.reply(`✅ Suspended user ${targetId}.\n🕒 Until: ${untilText}\n📝 Reason: ${reason || "No reason provided"}`);
  });

  bot.command("unsuspend", async (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);

    const targetId = resolveTargetId(ctx, parseCommandParts(ctx));
    if (!targetId) return ctx.reply("❌ Usage: /unsuspend <user_id>");

    if (!db.data.suspendedUsers[String(targetId)]) {
      return ctx.reply(`ℹ️ User ${targetId} is not suspended.`);
    }

    delete db.data.suspendedUsers[String(targetId)];
    await db.write();
    return ctx.reply(`✅ User ${targetId} unsuspended.`);
  });

  bot.command("banaccount", async (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);

    const parts = parseCommandParts(ctx);
    const targetId = resolveTargetId(ctx, parts);
    const reason = parts.slice(2).join(" ").trim();

    if (!targetId) return ctx.reply("❌ Usage: /banaccount <user_id> [reason]");
    if (isOwner(targetId)) return ctx.reply("❌ You cannot ban an owner account.");

    db.data.suspendedUsers[String(targetId)] = {
      by: String(ctx.from.id),
      reason: reason || "Owner account ban",
      suspendedAt: Date.now(),
      until: 0
    };
    await db.write();

    return ctx.reply(`✅ Account ${targetId} has been permanently banned from bot usage.`);
  });

  bot.command("unbanaccount", async (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);

    const targetId = resolveTargetId(ctx, parseCommandParts(ctx));
    if (!targetId) return ctx.reply("❌ Usage: /unbanaccount <user_id>");

    if (!db.data.suspendedUsers[String(targetId)]) {
      return ctx.reply(`ℹ️ Account ${targetId} is not banned/suspended.`);
    }

    delete db.data.suspendedUsers[String(targetId)];
    await db.write();
    return ctx.reply(`✅ Account ${targetId} unbanned.`);
  });

  bot.command("suspendlist", async (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);

    const now = Date.now();
    const rows = Object.entries(db.data.suspendedUsers || {})
      .filter(([, rec]) => !rec.until || rec.until > now)
      .slice(0, 25)
      .map(([id, rec], i) => {
        const untilText = rec.until ? new Date(rec.until).toISOString() : "Permanent";
        return `${i + 1}. \`${id}\` — ${untilText}\n   Reason: ${rec.reason || "No reason"}`;
      });

    if (!rows.length) return ctx.reply("✅ No suspended users.");

    return ctx.reply(`🚫 *Suspended/Banned Accounts*\n\n${rows.join("\n")}`, { parse_mode: "Markdown" });
  });

  /* ================= REPORTING ================= */
  bot.command("reportaccount", async (ctx) => {
    const parts = parseCommandParts(ctx);
    const targetId = resolveTargetId(ctx, parts);
    const reason = parts.slice(2).join(" ").trim();

    if (!targetId) return ctx.reply("❌ Usage: /reportaccount <user_id> [reason]");
    if (String(targetId) === String(ctx.from?.id)) return ctx.reply("❌ You cannot report your own account.");

    pushReport(db.data.reportedAccounts, String(targetId), {
      by: String(ctx.from?.id || "unknown"),
      username: ctx.from?.username ? `@${ctx.from.username}` : "no_username",
      reason: reason || "No reason provided",
      at: Date.now()
    });
    await db.write();

    return ctx.reply(`✅ Account report submitted for ${targetId}. Owner will review it soon.`);
  });

  bot.command("reportchannel", async (ctx) => {
    const parts = parseCommandParts(ctx);
    const channel = normalizeChannelId(parts[1]);
    const reason = parts.slice(2).join(" ").trim();

    if (!channel) return ctx.reply("❌ Usage: /reportchannel <@channel> [reason]");

    pushReport(db.data.reportedChannels, channel, {
      by: String(ctx.from?.id || "unknown"),
      username: ctx.from?.username ? `@${ctx.from.username}` : "no_username",
      reason: reason || "No reason provided",
      at: Date.now()
    });
    await db.write();

    return ctx.reply(`✅ Channel report submitted for ${channel}. Owner will review it soon.`);
  });

  bot.command("accountreports", (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);

    const rows = Object.entries(db.data.reportedAccounts || {})
      .map(([targetId, reports]) => ({ targetId, count: reports.length, latest: reports[reports.length - 1] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 25)
      .map((row, i) => {
        const latestReason = row.latest?.reason || "No reason";
        const latestBy = row.latest?.username || row.latest?.by || "unknown";
        return `${i + 1}. \`${row.targetId}\` — ${row.count} reports\n   Latest: ${latestReason} (by ${latestBy})`;
      });

    if (!rows.length) return ctx.reply("✅ No account reports.");

    return ctx.reply(`📝 *Reported Accounts (${rows.length})*\n\n${rows.join("\n")}`, { parse_mode: "Markdown" });
  });

  bot.command("channelreports", (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);

    const rows = Object.entries(db.data.reportedChannels || {})
      .map(([channel, reports]) => ({ channel, count: reports.length, latest: reports[reports.length - 1] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 25)
      .map((row, i) => {
        const latestReason = row.latest?.reason || "No reason";
        const latestBy = row.latest?.username || row.latest?.by || "unknown";
        return `${i + 1}. ${row.channel} — ${row.count} reports\n   Latest: ${latestReason} (by ${latestBy})`;
      });

    if (!rows.length) return ctx.reply("✅ No channel reports.");

    return ctx.reply(`📝 *Reported Channels (${rows.length})*\n\n${rows.join("\n")}`, { parse_mode: "Markdown" });
  });

  bot.command("clearreport", async (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);

    const [, typeArg, targetArg] = parseCommandParts(ctx);
    const type = String(typeArg || "").toLowerCase();

    if (type !== "account" && type !== "channel") {
      return ctx.reply("❌ Usage: /clearreport <account|channel> <target>");
    }

    const target = type === "channel" ? normalizeChannelId(targetArg) : String(targetArg || "");
    if (!target) return ctx.reply("❌ Usage: /clearreport <account|channel> <target>");

    if (type === "account") {
      if (!db.data.reportedAccounts[target]) return ctx.reply(`ℹ️ No reports found for account ${target}.`);
      delete db.data.reportedAccounts[target];
    } else {
      if (!db.data.reportedChannels[target]) return ctx.reply(`ℹ️ No reports found for channel ${target}.`);
      delete db.data.reportedChannels[target];
    }

    await db.write();
    return ctx.reply(`✅ Cleared ${type} reports for ${target}.`);
  });

  /* ================= CHANNEL CONTROLS ================= */
  bot.command("addchannel", async (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);

    const [, channelArg] = parseCommandParts(ctx);
    const channel = normalizeChannelId(channelArg);
    if (!channel) return ctx.reply("❌ Usage: /addchannel <@channel>");

    if (db.data.channels.includes(channel)) {
      return ctx.reply(`ℹ️ Channel ${channel} already exists.`);
    }

    db.data.channels.push(channel);
    await db.write();
    return ctx.reply(`✅ Channel ${channel} added.`);
  });

  bot.command("removechannel", async (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);

    const [, channelArg] = parseCommandParts(ctx);
    const channel = normalizeChannelId(channelArg);
    if (!channel) return ctx.reply("❌ Usage: /removechannel <@channel>");

    const before = db.data.channels.length;
    db.data.channels = db.data.channels.filter((c) => c !== channel);
    if (db.data.channels.length === before) {
      return ctx.reply(`ℹ️ Channel ${channel} not found.`);
    }

    await db.write();
    return ctx.reply(`✅ Channel ${channel} removed.`);
  });

  bot.command("channellist", (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);

    if (!db.data.channels.length) return ctx.reply("📭 No channels saved.");

    const rows = db.data.channels.slice(0, 50).map((c, i) => `${i + 1}. ${c}`);
    return ctx.reply(`📣 *Saved Channels (${rows.length})*\n\n${rows.join("\n")}`, { parse_mode: "Markdown" });
  });

  bot.command("banchannel", async (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);

    const parts = parseCommandParts(ctx);
    const channel = normalizeChannelId(parts[1]);
    const reason = parts.slice(2).join(" ").trim();

    if (!channel) return ctx.reply("❌ Usage: /banchannel <@channel> [reason]");

    db.data.bannedChannels[channel] = {
      by: String(ctx.from.id),
      reason: reason || "Owner channel ban",
      bannedAt: Date.now()
    };
    await db.write();

    return ctx.reply(`✅ Channel ${channel} has been banned from using bot features.`);
  });

  bot.command("unbanchannel", async (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);

    const [, channelArg] = parseCommandParts(ctx);
    const channel = normalizeChannelId(channelArg);
    if (!channel) return ctx.reply("❌ Usage: /unbanchannel <@channel>");

    if (!db.data.bannedChannels[channel]) {
      return ctx.reply(`ℹ️ Channel ${channel} is not banned.`);
    }

    delete db.data.bannedChannels[channel];
    await db.write();
    return ctx.reply(`✅ Channel ${channel} unbanned.`);
  });

  bot.command("bannedchannels", (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);

    const rows = Object.entries(db.data.bannedChannels || {})
      .slice(0, 50)
      .map(([channel, rec], i) => `${i + 1}. ${channel} — ${rec.reason || "No reason"}`);

    if (!rows.length) return ctx.reply("✅ No banned channels.");

    return ctx.reply(`🚫 *Banned Channels (${rows.length})*\n\n${rows.join("\n")}`, { parse_mode: "Markdown" });
  });

  bot.command("topusers", (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);

    const [, rawLimit] = parseCommandParts(ctx);
    const parsed = parsePositiveInt(rawLimit || 10) || 10;
    const limit = Math.min(parsed, 25);

    const rows = Object.entries(db.data.users || {})
      .map(([id, u]) => ({
        id,
        wallet: Number(u.wallet || 0),
        bank: Number(u.bank || 0),
        net: Number(u.wallet || 0) + Number(u.bank || 0)
      }))
      .sort((a, b) => b.net - a.net)
      .slice(0, limit)
      .map((row, i) => `${i + 1}. \`${row.id}\` — Net *${format(row.net)}* (W:${format(row.wallet)} | B:${format(row.bank)})`);

    if (!rows.length) return ctx.reply("📉 No users found in database.");

    return ctx.reply(`🏆 *Top ${rows.length} Users by Net Worth*\n\n${rows.join("\n")}`, {
      parse_mode: "Markdown"
    });
  });

  bot.command("ownerstats", (ctx) => {
    if (!isOwner(ctx.from?.id)) return deny(ctx);

    const users = Object.values(db.data.users || {});
    const premiumCount = users.filter((u) => (u.premiumUntil || 0) > Date.now()).length;
    const suspendedCount = Object.values(db.data.suspendedUsers || {})
      .filter((u) => !u.until || u.until > Date.now()).length;
    const reportedAccountCount = Object.keys(db.data.reportedAccounts || {}).length;
    const reportedChannelCount = Object.keys(db.data.reportedChannels || {}).length;
    const totalWallet = users.reduce((sum, u) => sum + Number(u.wallet || 0), 0);
    const totalBank = users.reduce((sum, u) => sum + Number(u.bank || 0), 0);

    ctx.reply(
`📊 *OWNER STATS*
👥 Known users: ${knownUsers.size}
👑 Owners: ${OWNERS.length}
💎 Premium users: ${premiumCount}
🚫 Suspended users: ${suspendedCount}
📝 Reported accounts: ${reportedAccountCount}
📝 Reported channels: ${reportedChannelCount}
📣 Saved channels: ${db.data.channels.length}
⛔ Banned channels: ${Object.keys(db.data.bannedChannels || {}).length}
👛 Total wallet coins: ${format(totalWallet)}
🏦 Total bank coins: ${format(totalBank)}
🤖 Bot: Online`,
      { parse_mode: "Markdown" }
    );
  });

  console.log("👑 Owner system loaded");
}
