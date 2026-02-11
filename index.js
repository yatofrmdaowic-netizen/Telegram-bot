import "dotenv/config";
import { Telegraf } from "telegraf";

/* ===== IMPORT MODULES ===== */
import menu from "./lib/menu.js";
import ai from "./lib/ai.js";
import downloads from "./lib/download.js";
import image from "./lib/image.js";
import economy from "./lib/economy.js";
import admin from "./lib/admin.js";
import owner from "./lib/owner.js";
import ping from "./lib/ping.js";
import runtime from "./lib/runtime.js";
import about from "./lib/about.js";
import system from "./lib/system.js";
import anti from "./lib/antilink_spam.js";
import stalker from "./lib/stalker.js";
import autoReact from "./lib/autoreact.js";
import instagramPublic from "./lib/instagramPublic.js";

/* ===== VALIDATE TOKEN ===== */
if (!process.env.BOT_TOKEN) {
  console.error("❌ BOT_TOKEN missing in .env");
  process.exit(1);
}

/* ===== CREATE BOT ===== */
const bot = new Telegraf(process.env.BOT_TOKEN);

/* ===== BASIC COMMANDS ===== */
bot.start(menu.start);
bot.command("menu", menu.menu);

/* ===== MODULE LIST ===== */
const modules = [
  ai,
  downloads,
  image,
  economy,
  admin,
  owner,
  ping,
  runtime,
  about,
  system,
  anti,
  stalker,
  autoReact,
  instagramPublic
];

/* ===== LOAD MODULES ===== */
for (const mod of modules) {
  try {
    mod(bot);
    console.log(`✅ Loaded module: ${mod.name}`);
  } catch (err) {
    console.error(`❌ Failed loading module: ${mod.name}`, err.message);
  }
}

/* ===== GLOBAL ERROR HANDLER ===== */
bot.catch(async (err, ctx) => {
  console.error("🚨 BOT ERROR:", err.message);
  try {
    if (ctx?.reply) {
      await ctx.reply("⚠️ Unexpected error occurred.");
    }
  } catch {}
});

/* ===== START BOT ===== */
async function startBot() {
  try {
    const info = await bot.telegram.getMe();
    console.log("=================================");
    console.log("🤖 SuperBot Starting...");
    console.log(`👤 Name: ${info.first_name}`);
    console.log(`🔗 Username: @${info.username}`);
    console.log("📡 Mode: Polling");
    console.log("=================================");
    await bot.launch();
    console.log("✅ Bot fully running");
  } catch (err) {
    console.error("❌ Launch failed:", err.message);
    process.exit(1);
  }
}

startBot();

/* ===== GRACEFUL SHUTDOWN ===== */
process.once("SIGINT", () => {
  console.log("🛑 SIGINT received. Stopping...");
  bot.stop("SIGINT");
});

process.once("SIGTERM", () => {
  console.log("🛑 SIGTERM received. Stopping...");
  bot.stop("SIGTERM");
});
