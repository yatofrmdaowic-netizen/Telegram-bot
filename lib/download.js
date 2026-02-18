// lib/download.js
import axios from "axios";
import ytdl from "ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import fs from "fs";

ffmpeg.setFfmpegPath(ffmpegPath);

const API_TIMEOUT = 20000;

const DOWNLOAD_APIS = {
  instagram: [
    (url) => `https://api.hanggts.xyz/download/instagram?url=${encodeURIComponent(url)}`,
    (url) => `https://api.vreden.my.id/api/instagram?url=${encodeURIComponent(url)}`
  ],
  tiktok: [
    (url) => `https://api.hanggts.xyz/download/tiktok?url=${encodeURIComponent(url)}`,
    (url) => `https://api.vreden.my.id/api/tiktok?url=${encodeURIComponent(url)}`
  ],
  facebook: [
    (url) => `https://api.hanggts.xyz/download/facebook?url=${encodeURIComponent(url)}`,
    (url) => `https://api.vreden.my.id/api/facebook?url=${encodeURIComponent(url)}`
  ],
  twitter: [
    (url) => `https://api.vreden.my.id/api/twitter?url=${encodeURIComponent(url)}`
  ]
};

async function fetchFromApis(key, targetUrl) {
  const builders = DOWNLOAD_APIS[key] || [];
  let lastError = null;

  for (const build of builders) {
    const apiUrl = build(targetUrl);
    try {
      const { data } = await axios.get(apiUrl, { timeout: API_TIMEOUT });
      if (data) return data;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("All APIs failed");
}

function parseInstagramMedia(data) {
  if (Array.isArray(data?.media)) return data.media;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function parseVideoUrl(data) {
  return (
    data?.video ||
    data?.data?.video ||
    data?.result?.video ||
    data?.url ||
    data?.data?.url ||
    data?.result?.url ||
    data?.result?.download ||
    data?.data?.download ||
    null
  );
}

function parseTwitterMedia(data) {
  if (Array.isArray(data?.media)) return data.media;
  if (Array.isArray(data?.result?.media)) return data.result.media;

  const single = parseVideoUrl(data);
  return single ? [{ type: "video", url: single }] : [];
}

function safeUnlink(file) {
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

export default function download(bot) {
  /* ================= YTMP3 ================= */
  bot.command("ytmp3", async (ctx) => {
    const url = ctx.message.text.split(" ")[1];
    if (!url) return ctx.reply("❌ Usage: /ytmp3 <youtube url>");
    if (!ytdl.validateURL(url)) return ctx.reply("❌ Invalid YouTube URL");

    const file = `yt_${Date.now()}.mp3`;
    await ctx.reply("🎵 Downloading MP3...");

    try {
      ffmpeg(ytdl(url, { quality: "highestaudio" }))
        .audioBitrate(128)
        .save(file)
        .on("end", async () => {
          await ctx.replyWithAudio({ source: file });
          safeUnlink(file);
        })
        .on("error", async () => {
          safeUnlink(file);
          await ctx.reply("❌ MP3 failed");
        });
    } catch (e) {
      console.error(e);
      safeUnlink(file);
      ctx.reply("❌ MP3 error");
    }
  });

  /* ================= YTMP4 ================= */
  bot.command("ytmp4", async (ctx) => {
    const url = ctx.message.text.split(" ")[1];
    if (!url) return ctx.reply("❌ Usage: /ytmp4 <youtube url>");
    if (!ytdl.validateURL(url)) return ctx.reply("❌ Invalid YouTube URL");

    const file = `yt_${Date.now()}.mp4`;
    await ctx.reply("🎬 Downloading MP4...");

    try {
      ytdl(url, { filter: "audioandvideo", quality: "highest" })
        .pipe(fs.createWriteStream(file))
        .on("finish", async () => {
          await ctx.replyWithVideo({ source: file });
          safeUnlink(file);
        })
        .on("error", async () => {
          safeUnlink(file);
          await ctx.reply("❌ MP4 failed");
        });
    } catch (e) {
      console.error(e);
      safeUnlink(file);
      ctx.reply("❌ MP4 error");
    }
  });

  /* ================= INSTAGRAM ================= */
  bot.command(["ig", "instagram"], async (ctx) => {
    const url = ctx.message.text.split(" ")[1];
    if (!url) return ctx.reply("❌ Usage: /instagram <url>");

    try {
      await ctx.reply("📥 Downloading Instagram...");
      const data = await fetchFromApis("instagram", url);
      const media = parseInstagramMedia(data);

      if (!media.length) return ctx.reply("❌ Failed");

      for (const m of media) {
        const mediaUrl = m.url || m.download || m.video || m.image;
        if (!mediaUrl) continue;

        if (m.type === "video" || m.mime?.includes("video") || m.video) {
          await ctx.replyWithVideo(mediaUrl);
        } else {
          await ctx.replyWithPhoto(mediaUrl);
        }
      }
    } catch (err) {
      console.error("Instagram error:", err.message);
      ctx.reply("❌ Instagram error");
    }
  });

  /* ================= TIKTOK ================= */
  bot.command(["tt", "tiktok"], async (ctx) => {
    const url = ctx.message.text.split(" ")[1];
    if (!url) return ctx.reply("❌ Usage: /tiktok <url>");

    try {
      await ctx.reply("📥 Downloading TikTok...");
      const data = await fetchFromApis("tiktok", url);
      const video = parseVideoUrl(data);

      if (!video) return ctx.reply("❌ Failed");
      await ctx.replyWithVideo(video, { caption: data?.title || data?.result?.title || "" });
    } catch (err) {
      console.error("TikTok error:", err.message);
      ctx.reply("❌ TikTok error");
    }
  });

  /* ================= FACEBOOK ================= */
  bot.command(["fb", "facebook"], async (ctx) => {
    const url = ctx.message.text.split(" ")[1];
    if (!url) return ctx.reply("❌ Usage: /facebook <url>");

    try {
      await ctx.reply("📥 Downloading Facebook...");
      const data = await fetchFromApis("facebook", url);
      const video = parseVideoUrl(data);

      if (!video) return ctx.reply("❌ Failed");
      await ctx.replyWithVideo(video);
    } catch (err) {
      console.error("Facebook error:", err.message);
      ctx.reply("❌ Facebook error");
    }
  });

  /* ================= TWITTER ================= */
  bot.command(["x", "twitter"], async (ctx) => {
    const url = ctx.message.text.split(" ")[1];
    if (!url) return ctx.reply("❌ Usage: /twitter <url>");

    try {
      await ctx.reply("📥 Downloading Twitter media...");
      const data = await fetchFromApis("twitter", url);
      const media = parseTwitterMedia(data);

      if (!media.length) return ctx.reply("❌ Failed");

      for (const m of media) {
        const mediaUrl = m.url || m.download || m.video || m.image;
        if (!mediaUrl) continue;
        if (m.type === "video" || m.video) await ctx.replyWithVideo(mediaUrl);
        else await ctx.replyWithPhoto(mediaUrl);
      }
    } catch (err) {
      console.error("Twitter error:", err.message);
      ctx.reply("❌ Twitter error");
    }
  });

  /* ================= GIT CLONE ZIP ================= */
  bot.command("gitclone", async (ctx) => {
    const repoUrl = ctx.message.text.split(" ")[1];
    if (!repoUrl) return ctx.reply("❌ Usage: /gitclone <github_repo_url>");

    try {
      const match = repoUrl.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git|\/)?$/i);
      if (!match) return ctx.reply("❌ Invalid GitHub URL");

      const owner = match[1];
      const repo = match[2];
      const zipUrl = `https://api.github.com/repos/${owner}/${repo}/zipball`;

      await ctx.replyWithDocument({ url: zipUrl, filename: `${repo}.zip` });
    } catch (err) {
      console.error("Gitclone error:", err.message);
      ctx.reply("❌ Git clone download error");
    }
  });

  console.log("⬇️ Download system loaded (free)");
}
