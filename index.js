import 'dotenv/config'
import { Telegraf } from "telegraf"

import menu from "./lib/menu.js"
import ai from "./lib/ai.js"
import downloads from "./lib/download.js"
import image from "./lib/image.js"
import economy from "./lib/economy.js"
import admin from "./lib/admin.js"

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.start(menu.start)
bot.command("menu", menu.menu)

ai(bot)
downloads(bot)
image(bot)
economy(bot)
admin(bot)

bot.launch()
console.log("🤖 Bot running...")
