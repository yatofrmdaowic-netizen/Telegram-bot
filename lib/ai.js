import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export default bot => {

  bot.command("gpt", async ctx => {
    const q = ctx.message.text.split(" ").slice(1).join(" ")
    if (!q) return ctx.reply("Ask something")

    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: q }]
    })

    ctx.reply(res.choices[0].message.content)
  })

  bot.command("text2image", async ctx => {
    const p = ctx.message.text.split(" ").slice(1).join(" ")
    const img = await openai.images.generate({
      model: "gpt-image-1",
      prompt: p
    })
    ctx.replyWithPhoto(img.data[0].url)
  })

  bot.command("text2speech", async ctx => {
    const text = ctx.message.text.split(" ").slice(1).join(" ")
    const audio = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: text
    })
    ctx.replyWithAudio({ source: Buffer.from(await audio.arrayBuffer()) })
  })
}
