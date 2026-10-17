let limit = 30
import { ytdlp } from '../../lib/ytdlp.js'
let handler = async (m, { conn, args, isPrems, isOwner }) => {
  if (!args || !args[0]) throw 'Uhm... urlnya mana?'
  let chat = global.db.data.chats[m.chat]
  let isY = /y(es)/gi.test(args[1])
  await m.reply(wait)
  const { data, title, thumbnail } = await ytdlp(args[0], { maxSize: isPrems || isOwner ? 99 : limit })
  const caption = `
📌 *Title:* ${title}
🗎 *Filesize:* ${(data.length / 1024 / 1024).toFixed(1)} MB
`.trim()
  if (!isY && thumbnail) await conn.sendFile(m.chat, thumbnail, 'thumbnail.jpg', caption, m)
  await conn.sendFile(m.chat, data, title + '.mp4', caption, m, false, { asDocument: chat.useDocument })
}
handler.help = ['mp4', 'v', ''].map(v => 'yt' + v + ` <url>`)
handler.tags = ['downloader']
handler.command = /^yt(v|mp4)?$/i

handler.exp = 0


export default handler
