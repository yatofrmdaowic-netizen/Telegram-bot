import axios from "axios";
import { Markup } from "telegraf";

const TMDB = "https://api.themoviedb.org/3";
const KEY = process.env.TMDB_API_KEY;

const HOME_KEYBOARD = Markup.inlineKeyboard([
  [Markup.button.callback("🔥 Trending", "cat_trending_1")],
  [Markup.button.callback("⭐ Top Rated", "cat_top_1")],
  [Markup.button.callback("🎭 Action", "cat_action_1")],
  [Markup.button.callback("😂 Comedy", "cat_comedy_1")]
]);

function getCategoryEndpoint(category, page) {
  if (category === "trending") {
    return `${TMDB}/trending/movie/week?api_key=${KEY}&page=${page}`;
  }
  if (category === "top") {
    return `${TMDB}/movie/top_rated?api_key=${KEY}&page=${page}`;
  }
  if (category === "action") {
    return `${TMDB}/discover/movie?api_key=${KEY}&with_genres=28&page=${page}`;
  }
  if (category === "comedy") {
    return `${TMDB}/discover/movie?api_key=${KEY}&with_genres=35&page=${page}`;
  }
  return null;
}

export default function cineverse(bot) {
  console.log("🎬 Cineverse Netflix UI Loaded");

  if (!KEY) {
    console.log("❌ TMDB_API_KEY missing");
    return;
  }

  /* ================= HOME ================= */
  bot.command("cineverse", async (ctx) => {
    return ctx.reply(
      `🎬 *CINEVERSE*\n\nWelcome to Netflix Mode 🍿\n\nChoose Category:`,
      {
        parse_mode: "Markdown",
        ...HOME_KEYBOARD
      }
    );
  });

  /* ================= CATEGORY HANDLER ================= */
  bot.action(/cat_(.+)_(\d+)/, async (ctx) => {
    const category = ctx.match[1];
    const page = Math.max(1, Number(ctx.match[2]) || 1);
    const endpoint = getCategoryEndpoint(category, page);

    if (!endpoint) {
      return ctx.answerCbQuery("Unknown category");
    }

    try {
      const { data } = await axios.get(endpoint);
      const movies = Array.isArray(data?.results) ? data.results.slice(0, 5) : [];

      if (!movies.length) {
        return ctx.answerCbQuery("No results found");
      }

      let text = `🎬 ${category.toUpperCase()} — Page ${page}\n\n`;
      movies.forEach((m, i) => {
        text += `${i + 1}. ${m.title}\n`;
      });

      return ctx.editMessageText(text, {
        ...Markup.inlineKeyboard([
          movies.map((m) => Markup.button.callback((m.title || "Untitled").slice(0, 20), `movie_${m.id}`)),
          [
            Markup.button.callback("⬅ Prev", `cat_${category}_${Math.max(1, page - 1)}`),
            Markup.button.callback("Next ➡", `cat_${category}_${page + 1}`)
          ],
          [Markup.button.callback("🏠 Home", "go_home")]
        ])
      });
    } catch (error) {
      console.error("❌ Cineverse category error:", error.message);
      await ctx.answerCbQuery("Failed to load category");
      return ctx.reply("❌ Failed to load movies. Try again later.");
    }
  });

  /* ================= MOVIE DETAILS ================= */
  bot.action(/movie_(\d+)/, async (ctx) => {
    const id = ctx.match[1];

    try {
      const { data } = await axios.get(`${TMDB}/movie/${id}?api_key=${KEY}`);
      const poster = data?.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null;
      const overview = data?.overview ? data.overview.slice(0, 250) : "No description available.";

      if (poster) {
        return ctx.replyWithPhoto(poster, {
          caption: `🎬 ${data.title}\n⭐ ${data.vote_average}\n📅 ${data.release_date}\n\n📝 ${overview}...`,
          ...Markup.inlineKeyboard([
            [Markup.button.callback("📺 Stream", `stream_${id}`)],
            [Markup.button.callback("🔙 Back", "go_home")]
          ])
        });
      }

      return ctx.reply(
        `🎬 ${data.title}\n⭐ ${data.vote_average}\n📅 ${data.release_date}\n\n📝 ${overview}...`,
        Markup.inlineKeyboard([
          [Markup.button.callback("📺 Stream", `stream_${id}`)],
          [Markup.button.callback("🔙 Back", "go_home")]
        ])
      );
    } catch (error) {
      console.error("❌ Cineverse movie detail error:", error.message);
      await ctx.answerCbQuery("Failed to load details");
      return ctx.reply("❌ Could not load movie details.");
    }
  });

  /* ================= STREAM ================= */
  bot.action(/stream_(\d+)/, async (ctx) => {
    const id = ctx.match[1];

    try {
      const { data } = await axios.get(`${TMDB}/movie/${id}/watch/providers?api_key=${KEY}`);
      const country = data?.results?.US;

      if (!country) {
        return ctx.reply("No providers found.");
      }

      let text = "📺 Available On:\n\n";

      if (Array.isArray(country.flatrate)) {
        country.flatrate.forEach((p) => {
          text += `• ${p.provider_name}\n`;
        });
      }

      if (country.link) {
        text += `\n🔗 Watch Here:\n${country.link}`;
      }

      return ctx.reply(text);
    } catch (error) {
      console.error("❌ Cineverse stream error:", error.message);
      await ctx.answerCbQuery("Failed to load stream providers");
      return ctx.reply("❌ Could not fetch streaming providers.");
    }
  });

  /* ================= HOME BUTTON ================= */
  bot.action("go_home", async (ctx) => {
    return ctx.editMessageText(
      `🎬 *CINEVERSE*\n\nBack to main menu 🍿`,
      {
        parse_mode: "Markdown",
        ...HOME_KEYBOARD
      }
    );
  });
}
