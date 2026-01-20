export default function ping(bot) {
  bot.command("ping", async (ctx) => {
    const start = Date.now();
    const msg = await ctx.reply("🏓 Pinging...");
    const end = Date.now();
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      msg.message_id,
      null,
      `🏓 Pong!\n⚡ Speed: ${end - start} ms`
    );
  });
}
