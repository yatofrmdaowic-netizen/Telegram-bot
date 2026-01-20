import { Markup } from "telegraf"

export default {
  start: ctx => {
    await ctx.replyWithPhoto(
      { source: "assets/menu.jpg" }, /
      {
        caption: "🤖 *Super Bot Menu*",
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("🤖 AI", "MENU_AI")],
          [Markup.button.callback("⬇️ Downloads", "MENU_DL")],
          [Markup.button.callback("🖼 Images", "MENU_IMG")],
          [Markup.button.callback("💰 Economy", "MENU_ECO")]
        ])
      }
    )
  },

  menu: ctx => ctx.reply("Use /start")
}
