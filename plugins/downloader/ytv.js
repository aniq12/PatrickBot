let limit = 30, premLimit = 2000
import { promises as fs } from 'fs'
import { ytdlp } from '../../lib/ytdlp.js'
let handler = async (m, { conn, args, isPrems, isOwner }) => {
  if (!args || !args[0]) throw 'Uhm... urlnya mana?'
  let chat = global.db.data.chats[m.chat]
  let isY = /y(es)/gi.test(args[1])
  // max resolution, e.g. ".ytv <url> 1080" or ".ytv <url> yes 480p" (the play buttons); lower if it doesn't fit the size limit
  let res = parseInt(args.slice(1).find(a => /^\d{3,4}p?$/i.test(a))) || 720
  await m.reply(wait)
  // premium: up to WhatsApp's 2 GB document limit; kept on disk and streamed, not loaded into memory
  const { path, size, title, height, thumbnail } = await ytdlp(args[0], { maxSize: isPrems || isOwner ? premLimit : limit, height: res, keepFile: true })
  try {
    const caption = `
📌 *Title:* ${title}
${height ? `📺 *Resolusi:* ${height}p\n` : ''}🗎 *Filesize:* ${(size / 1024 / 1024).toFixed(1)} MB
`.trim()
    if (!isY && thumbnail) await conn.sendFile(m.chat, thumbnail, 'thumbnail.jpg', caption, m)
    // WhatsApp only plays videos up to ~100 MB in chat; bigger ones go through as a document
    const asDocument = chat.useDocument || size > 100 * 1024 * 1024
    await conn.sendMessage(m.chat, { [asDocument ? 'document' : 'video']: { url: path }, mimetype: 'video/mp4', fileName: title + '.mp4', caption }, { quoted: m })
  } finally {
    await fs.unlink(path).catch(() => { })
  }
}
handler.help = ['mp4', 'v', ''].map(v => 'yt' + v + ` <url> [360/480/720/1080]`)
handler.tags = ['downloader']
handler.command = /^yt(v|mp4)?$/i

handler.exp = 0


export default handler
