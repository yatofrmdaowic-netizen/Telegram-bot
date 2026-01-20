import { Low } from "lowdb"
import { JSONFile } from "lowdb/node"

const db = new Low(new JSONFile("database.json"))
await db.read()
db.data ||= { users: {} }

const user = id =>
  db.data.users[id] ||= { wallet: 500 }

export default bot => {

  bot.command("balance", async ctx => {
    const u = user(ctx.from.id)
    ctx.reply(`💰 Wallet: ${u.wallet}`)
  })

  bot.command("beg", async ctx => {
    const u = user(ctx.from.id)
    const earn = Math.floor(Math.random() * 200)
    u.wallet += earn
    await db.write()
    ctx.reply(`🙏 You got ${earn}`)
  })
}
