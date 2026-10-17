let limit = 50
import { ytdlp } from '../../lib/ytdlp.js'
let handler = async (m, { conn, args, isPrems, isOwner }) => {
  if (!args || !args[0]) throw 'Uhm... urlnya mana?'
  let chat = global.db.data.chats[m.chat]
  const isY = /y(es)/gi.test(args[1])
  await m.reply(wait)
  const { data, ext, title, thumbnail } = await ytdlp(args[0], { audio: true, maxSize: isPrems || isOwner ? 99 : limit })
  if (!isY && thumbnail) await conn.sendFile(m.chat, thumbnail, 'thumbnail.jpg', `
📌*Title:* ${title}
🗎 *Filesize:* ${(data.length / 1024 / 1024).toFixed(1)} MB
`.trim(), m)
  await conn.sendFile(m.chat, data, title + '.' + ext, '', m, null, {
    asDocument: chat.useDocument,
    fileName: title + '.' + ext
  })
}
handler.help = ['mp3', 'a'].map(v => 'yt' + v + ` <url>`)
handler.tags = ['downloader']
handler.command = /^yt(a|mp3)$/i

handler.exp = 0

export default handler
