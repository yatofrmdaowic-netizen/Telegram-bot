# 🤖 Telegram Multi‑Feature Bot

A powerful **Telegram bot** built with **Node.js + Telegraf** featuring **AI chat**, **image tools**, **media downloads**, **admin controls**, **economy system**, and **owner utilities**.

---

## 🚀 Features

### 🤖 AI
- `/gpt <text>` – Chat with AI
- `/chatbot on|off` – Enable/disable auto AI chat
- `/text2image <prompt>` – AI image generation
- `/flux <prompt>` – Fast image generator
- `/text2speech <text>` – AI voice (TTS)

---

### ⬇️ Downloads
- `/ytmp3 <url>` – YouTube MP3
- `/ytmp4 <url>` – YouTube MP4
- `/facebook <url>` – Facebook video
- `/instagram <url>` – Instagram media
- `/tiktok <url>` – TikTok video
- `/twitter <url>` – X / Twitter media
- `/gitclone <repo_url>` – Download GitHub repo ZIP

---

### 🖼 Image Tools
- `/image <query>`
- `/wallpaper <query>`
- `/sticker` *(reply to image)*
- `/rmbg` *(remove background)*
- `/remini` *(enhance image quality)*
- Inline buttons: **Re‑Generate / Remove BG / Sticker**

---

### 💰 Economy System
- `/balance` (also `/bal`)
- `/deposit <amount|all>`
- `/withdraw <amount|all>`
- `/beg`
- `/work` *(new: 15m cooldown)*
- `/crime` *(new: risky reward command)*
- `/give <amount>` *(reply)*
- `/rob` *(reply)*
- `/coinflip <amount> <h/t>`
- `/dice <amount> <1‑6>`
- `/slots <amount>`
- `/aviator <amount>`
- `/leaderboard`

---


### 💎 Premium System
- `/premium` – View premium plans and benefits
- `/buypremium <7|30>` – Buy premium using economy coins
- `/premiumstatus` – Check your premium status
- `/premiumdaily` – Claim premium-only bonus every 12h
- Premium boosts now also improve `/work` rewards and `/crime` success rate

---

### 👮 Admin Commands
- `/antilink on|off`
- `/kick [reason]` *(reply to user)*
- `/ban [reason]` *(reply to user)*
- `/unban` *(reply to user)*
- `/mute [reason]` *(reply to user)*
- `/unmute` *(reply to user)*
- `/tempmute <10m|1h|1d> [reason]` *(reply to user)*
- `/warn [reason]` *(reply to user)*
- `/warns` *(reply to user)*
- `/clearwarns` *(reply to user)*
- `/lock` / `/unlock`
- `/pin` *(reply to message)*
- `/unpin`
- `/purge <1-100>` *(reply to a recent message)*
- `/adminhelp` / `/adminpanel`

---

### 👑 Owner / Developer
- `/owner`
- `/restart`
- `/eval <code>`
- `/broadcast <text>`
- `/addpremium <user_id> <days>`
- `/removepremium <user_id>`
- `/premiumlist`
- `/addcoins <user_id> <amount>`
- `/removecoins <user_id> <amount>`
- `/setbalance <user_id> <wallet> [bank]`
- `/resetuser <user_id>`
- `/userinfo <user_id>`
- `/topusers [count]`
- `/ownerstats`

---

## 📁 Project Structure
