const startTime = Date.now();

export default function runtime(bot) {
  bot.command("runtime", (ctx) => {
    const uptime = Date.now() - startTime;

    const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((uptime / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((uptime / (1000 * 60)) % 60);
    const seconds = Math.floor((uptime / 1000) % 60);

    ctx.reply(
      `⏱ Bot Runtime\n\n` +
      `🗓 ${days} Days\n` +
      `⏰ ${hours} Hours\n` +
      `⏳ ${minutes} Minutes\n` +
      `⏲ ${seconds} Seconds`
    );
  });
}
