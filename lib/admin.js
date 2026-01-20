export default bot => {

  bot.command("kick", async ctx => {
    if (!ctx.message.reply_to_message) return
    await ctx.kickChatMember(
      ctx.message.reply_to_message.from.id
    )
    ctx.reply("👢 Kicked")
  })

  bot.command("mute", async ctx => {
    if (!ctx.message.reply_to_message) return
    await ctx.restrictChatMember(
      ctx.message.reply_to_message.from.id,
      { permissions: {} }
    )
    ctx.reply("🔇 Muted")
  })
}
