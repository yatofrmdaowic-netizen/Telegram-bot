// lib/download.js
import axios from "axios";
import ytdl from "ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import fs from "fs";
import path from "path";

ffmpeg.setFfmpegPath(ffmpegPath);

export default function download(bot) {

  /* ================= YTMP3 ================= */
  bot.command("ytmp3", async (ctx) => {
    const url = ctx.message.text.split(" ")[1];
    if (!url) return ctx.reply("❌ Usage: /ytmp3 <youtube url>");
    if (!ytdl.validateURL(url)) return ctx.reply("❌ Invalid YouTube URL");

    const file = `audio_${Date.now()}.mp3`;
    ctx.reply("🎵 Downloading MP3...");

    try {
      const stream = ytdl(url, { quality: "highestaudio" });

      ffmpeg(stream)
        .audioBitrate(128)
        .save(file)
        .on("end", async () => {
          await ctx.replyWithAudio({ source: file });
          fs.unlinkSync(file);
        });

    } catch (err) {
      console.error(err);
      ctx.reply("❌ MP3 download failed");
    }
  });

  /* ================= YTMP4 ================= */
  bot.command("ytmp4", async (ctx) => {
    const url = ctx.message.text.split(" ")[1];
    if (!url) return ctx.reply("❌ Usage: /ytmp4 <youtube url>");
    if (!ytdl.validateURL(url)) return ctx.reply("❌ Invalid YouTube URL");

    const file = `video_${Date.now()}.mp4`;
    ctx.reply("🎬 Downloading MP4...");

    try {
      ytdl(url, { quality: "highestvideo" })
        .pipe(fs.createWriteStream(file))
        .on("finish", async () => {
          await ctx.replyWithVideo({ source: file });
          fs.unlinkSync(file);
        });

    } catch (err) {
      console.error(err);
      ctx.reply("❌ MP4 download failed");
    }
  });

  /* ================= INSTAGRAM ================= */
  bot.command("instagram", async (ctx) => {
    const url = ctx.message.text.split(" ")[1];
    if (!url) return ctx.reply("❌ Usage: /instagram <url>");

    try {
      ctx.reply("📥 Downloading Instagram...");
      const api = `https://api.vxtiktok.com/instagram?url=${encodeURIComponent(url)}`;
      const { data } = await axios.get(api);

      if (!data?.media) return ctx.reply("❌ Failed");

      for (const m of data.media) {
        if (m.type === "video") {
          await ctx.replyWithVideo({ url: m.url });
        } else {
          await ctx.replyWithPhoto({ url: m.url });
        }
      }
    } catch (e) {
      ctx.reply("❌ Instagram error");
    }
  });

  /* ================= FACEBOOK ================= */
  bot.command("facebook", async (ctx) => {
    const url = ctx.message.text.split(" ")[1];
    if (!url) return ctx.reply("❌ Usage: /facebook <url>");

    try {
      ctx.reply("📥 Downloading Facebook...");
      const api = `https://api.vxtiktok.com/facebook?url=${encodeURIComponent(url)}`;
      const { data } = await axios.get(api);

      if (!data?.video) return ctx.reply("❌ Failed");

      await ctx.replyWithVideo({ url: data.video });
    } catch (e) {
      ctx.reply("❌ Facebook error");
    }
  });

}
