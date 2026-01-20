import axios from "axios";
import fs from "fs";
import path from "path";
import ytdl from "ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

ffmpeg.setFfmpegPath(ffmpegPath);

/* ================= HELPERS ================= */
const tmp = "./tmp";
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp);

/* ================= YOUTUBE ================= */
export async function ytmp3(ctx, url) {
  if (!ytdl.validateURL(url)) return ctx.reply("❌ Invalid YouTube URL");

  const inFile = path.join(tmp, `yt_${Date.now()}.mp4`);
  const outFile = path.join(tmp, `yt_${Date.now()}.mp3`);

  ctx.reply("🎵 Converting to MP3...");

  ytdl(url).pipe(fs.createWriteStream(inFile)).on("finish", () => {
    ffmpeg(inFile)
      .toFormat("mp3")
      .save(outFile)
      .on("end", async () => {
        await ctx.replyWithAudio({ source: outFile });
        fs.unlinkSync(inFile);
        fs.unlinkSync(outFile);
      });
  });
}

export async function ytmp4(ctx, url) {
  if (!ytdl.validateURL(url)) return ctx.reply("❌ Invalid YouTube URL");

  const outFile = path.join(tmp, `yt_${Date.now()}.mp4`);
  ctx.reply("🎬 Downloading video...");

  ffmpeg()
    .input(ytdl(url, { quality: "highestvideo" }))
    .input(ytdl(url, { quality: "highestaudio" }))
    .save(outFile)
    .on("end", async () => {
      await ctx.replyWithVideo({ source: outFile });
      fs.unlinkSync(outFile);
    });
}

/* ================= FACEBOOK ================= */
export async function facebook(ctx, url) {
  try {
    ctx.reply("📥 Fetching Facebook video...");

    const api = `https://api.popcat.xyz/facebook?url=${encodeURIComponent(url)}`;
    const res = await axios.get(api);

    if (!res.data.video) return ctx.reply("❌ Failed to fetch video");

    await ctx.replyWithVideo(res.data.video);
  } catch (e) {
    ctx.reply("⚠️ Facebook download failed");
  }
}

/* ================= INSTAGRAM / TIKTOK / X ================= */
export async function social(ctx, platform, url) {
  try {
    ctx.reply("📥 Downloading media...");

    const api = `https://api.popcat.xyz/${platform}?url=${encodeURIComponent(url)}`;
    const res = await axios.get(api);

    if (!res.data.video) return ctx.reply("❌ Failed");

    await ctx.replyWithVideo(res.data.video);
  } catch {
    ctx.reply("⚠️ Download failed");
  }
}

/* ================= GITHUB CLONE ================= */
export async function gitclone(ctx, repoUrl) {
  try {
    if (!repoUrl.includes("github.com"))
      return ctx.reply("❌ Invalid GitHub repo URL");

    const zipUrl = repoUrl
      .replace("github.com", "codeload.github.com")
      .replace(/\/$/, "") + "/zip/refs/heads/main";

    ctx.reply("📦 Downloading repository...");

    const res = await axios.get(zipUrl, { responseType: "arraybuffer" });
    const file = path.join(tmp, `repo_${Date.now()}.zip`);

    fs.writeFileSync(file, res.data);
    await ctx.replyWithDocument({ source: file });

    fs.unlinkSync(file);
  } catch {
    ctx.reply("⚠️ Git clone failed (branch must be main)");
  }
}
