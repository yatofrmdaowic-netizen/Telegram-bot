// lib/runtime.js
const startTime = Date.now();

/* ===== HELPER ===== */
function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return { days, hours, minutes, secs };
}

export default function runtime(bot) {
  bot.command("runtime", async (ctx) => {
    const uptime = Date.now() - startTime;
    const { days, hours, minutes, secs } = formatUptime(uptime);

    await ctx.reply(
`⏱ *BOT RUNTIME*

🗓 *Days:* ${days}
⏰ *Hours:* ${hours}
⏳ *Minutes:* ${minutes}
⏲ *Seconds:* ${secs}

🚀 *Status:* Online & Stable`,
      { parse_mode: "Markdown" }
    );
  });
}
