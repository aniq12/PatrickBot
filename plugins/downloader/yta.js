let limit = 50
import { ytdlp } from '../../lib/ytdlp.js'
let handler = async (m, { conn, args, isPrems, isOwner }) => {
  if (!args || !args[0]) throw 'Uhm... urlnya mana?'
  const isY = /y(es)/gi.test(args[1])
  await m.reply(wait)
  const { data, ext, title, thumbnail } = await ytdlp(args[0], { audio: true, maxSize: isPrems || isOwner ? 99 : limit })
  if (!isY && thumbnail) await conn.sendFile(m.chat, thumbnail, 'thumbnail.jpg', `
📌*Title:* ${title}
🗎 *Filesize:* ${(data.length / 1024 / 1024).toFixed(1)} MB
`.trim(), m)
  // always a document: it saves as a music file with its title. (As "audio", .m4a is detected as video/mp4
  // and arrives as a blank video.)
  await conn.sendFile(m.chat, data, title + '.' + ext, '', m, null, {
    asDocument: true,
    mimetype: mimetypes[ext] || 'audio/mpeg',
    fileName: title + '.' + ext
  })
}
const mimetypes = { m4a: 'audio/mp4', webm: 'audio/webm', opus: 'audio/ogg', mp3: 'audio/mpeg' }
handler.help = ['mp3', 'a'].map(v => 'yt' + v + ` <url>`)
handler.tags = ['downloader']
handler.command = /^yt(a|mp3)$/i

handler.exp = 0

export default handler
