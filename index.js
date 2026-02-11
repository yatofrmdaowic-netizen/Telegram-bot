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

/* ===== VALIDATE TOKEN ===== */
if (!process.env.BOT_TOKEN) {
  console.error("❌ BOT_TOKEN is missing in .env");
  process.exit(1);
}

/* ===== CREATE BOT ===== */
const bot = new Telegraf(process.env.BOT_TOKEN);

/* ===== BASIC COMMANDS ===== */
bot.start(menu.start);
bot.command("menu", menu.menu);

/* ===== LOAD MODULES ===== */
[
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
  stalker
].forEach(module => {
  try {
    module(bot);
    console.log(`✅ Loaded module: ${module.name}`);
  } catch (err) {
    console.error(`❌ Failed loading module: ${module.name}`, err);
  }
});

/* ===== GLOBAL ERROR HANDLER ===== */
bot.catch((err, ctx) => {
  console.error("🚨 BOT ERROR:", err);
  if (ctx?.reply) {
    ctx.reply("⚠️ Unexpected error occurred.");
  }
});

/* ===== START BOT ===== */
async function startBot() {
  try {
    await bot.launch();
    console.log("🤖 Bot fully running in polling mode");
  } catch (err) {
    console.error("❌ Failed to launch bot:", err);
    process.exit(1);
  }
}

startBot();

/* ===== GRACEFUL SHUTDOWN ===== */
process.once("SIGINT", () => {
  console.log("🛑 Bot shutting down (SIGINT)");
  bot.stop("SIGINT");
});

process.once("SIGTERM", () => {
  console.log("🛑 Bot shutting down (SIGTERM)");
  bot.stop("SIGTERM");
});
