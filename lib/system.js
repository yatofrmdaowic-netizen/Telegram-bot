import os from "os";

/* ===== BOT START TIME (OPTIONAL) ===== */
const startTime = Date.now();

function formatBytes(bytes) {
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 B";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + " " + sizes[i];
}

function getCpuLoad() {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;

  for (const cpu of cpus) {
    for (const type in cpu.times) {
      total += cpu.times[type];
    }
    idle += cpu.times.idle;
  }

  return ((1 - idle / total) * 100).toFixed(2);
}

export default function system(bot) {
  bot.command("system", async (ctx) => {
    const mem = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    const uptime = Date.now() - startTime;
    const hours = Math.floor(uptime / 3600000);
    const minutes = Math.floor((uptime % 3600000) / 60000);

    const text = `
🖥 *SYSTEM STATUS*

🧠 *Memory Usage*
• RSS: ${formatBytes(mem.rss)}
• Heap Used: ${formatBytes(mem.heapUsed)}
• Heap Total: ${formatBytes(mem.heapTotal)}

💾 *Server Memory*
• Total: ${formatBytes(totalMem)}
• Free: ${formatBytes(freeMem)}

⚙️ *CPU*
• Cores: ${os.cpus().length}
• Load: ${getCpuLoad()} %

⏱ *Uptime*
• ${hours}h ${minutes}m
`;

    ctx.reply(text, { parse_mode: "Markdown" });
  });
}
