// lib/autoreact.js

export default function autoReact(bot) {

  const emojis = ["🔥", "💯", "😎", "✨", "👍"];

  function random(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  bot.on("message", async (ctx) => {
    try {
      // ✅ Only allow groups
      if (!ctx.chat || !["group", "supergroup"].includes(ctx.chat.type)) return;

      // ❌ Ignore commands
      if (ctx.message?.text?.startsWith("/")) return;

      // ❌ Ignore non-text
      if (!ctx.message?.text) return;

      const emoji = random(emojis);

      await ctx.react(emoji);

    } catch (err) {
      console.log("AutoReact error:", err.message);
    }
  });

  console.log("⚡ Group Auto React loaded");
}
