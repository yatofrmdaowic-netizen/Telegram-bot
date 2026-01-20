import axios from "axios"
import { Markup } from "telegraf"

export default bot => {

  bot.on("photo", async ctx => {
    const fileId = ctx.message.photo.pop().file_id

    ctx.reply(
      "🖼 Image tools",
      Markup.inlineKeyboard([
        [Markup.button.callback("🔄 Re‑Gen", `REGEN|${fileId}`)],
        [Markup.button.callback("🧹 Remove BG", `RMBG|${fileId}`)],
        [Markup.button.callback("🖼 Sticker", `STICKER|${fileId}`)]
      ])
    )
  })

  bot.action(/RMBG\|(.+)/, async ctx => {
    await ctx.replyWithPhoto(
      `https://api.popcat.xyz/rmbg?image=${ctx.match[1]}`
    )
  })
}
