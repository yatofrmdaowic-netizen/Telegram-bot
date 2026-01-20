import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

// ✅ adapter
const adapter = new JSONFile("database.json");

// ✅ DEFAULT DATA MUST BE HERE
const defaultData = {
  users: {}
};

// ✅ pass defaultData to Low
const db = new Low(adapter, defaultData);

// ✅ top-level await is OK (Node 18 + "type": "module")
await db.read();
db.data ||= defaultData;

// helper
const user = (id) => {
  return (db.data.users[id] ||= { wallet: 500 });
};

export default function economy(bot) {

  bot.command("balance", async (ctx) => {
    const u = user(ctx.from.id);
    await db.write();
    ctx.reply(`💰 Wallet: ${u.wallet}`);
  });

  bot.command("beg", async (ctx) => {
    const u = user(ctx.from.id);
    const earn = Math.floor(Math.random() * 200);
    u.wallet += earn;
    await db.write();
    ctx.reply(`🙏 You got ${earn}`);
  });

}
