// lib/ping.js
export default function ping(bot) {
  bot.command("ping", async (ctx) => {
    const start = Date.now();

    try {
      // Send initial message
      const sent = await ctx.reply("🏓 Pinging...");

      const latency = Date.now() - start;
      const uptime = formatUptime(process.uptime());

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        sent.message_id,
        undefined,
        `🏓 *Pong!*\n` +
        `⚡ *Latency:* ${latency} ms\n` +
        `⏱ *Uptime:* ${uptime}`,
        { parse_mode: "Markdown" }
      );

    } catch (err) {
      console.error("PING ERROR:", err);
      ctx.reply("❌ Ping failed");
    }
  });
}

/* ===== HELPER ===== */
function formatUptime(seconds) {
  seconds = Math.floor(seconds);
  const d = Math.floor(seconds / 86400);
  const h = Math.floor(seconds / 3600) % 24;
  const m = Math.floor(seconds / 60) % 60;
  const s = seconds % 60;

  return `${d}d ${h}h ${m}m ${s}s`;
}
