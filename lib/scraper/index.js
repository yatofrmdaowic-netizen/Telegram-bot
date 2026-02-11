import { scrapeInstagram } from "./instagram.js";
import { scrapeTikTok } from "./tiktok.js";
import { scrapeFacebook } from "./facebook.js";

export async function scrape(platform, input) {
  switch (platform) {
    case "instagram":
      return await scrapeInstagram(input);

    case "tiktok":
      return await scrapeTikTok(input);

    case "facebook":
      return await scrapeFacebook(input);

    default:
      throw new Error("Unsupported platform");
  }
}
