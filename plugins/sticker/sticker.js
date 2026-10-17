import { sticker } from '../../lib/sticker.js'

let handler = async (m, { conn, args, usedPrefix, command }) => {
  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || q.mediaType || ''
  let stiker
  if (/webp|image|video/g.test(mime)) {
    if (/video/g.test(mime) && (q.msg || q).seconds > 11) return m.reply('Maksimal 10 detik!')
    let img = await q.download?.()
    if (!img) throw `balas gambar/video/stiker dengan perintah ${usedPrefix + command}`
    stiker = await sticker(img, false, global.packname, global.author)
  } else if (args[0]) {
    if (!isUrl(args[0])) return m.reply('URL tidak valid!')
    stiker = await sticker(false, args[0], global.packname, global.author)
  } else throw `balas gambar/video/stiker dengan perintah ${usedPrefix + command}`
  await conn.sendFile(m.chat, stiker, 'sticker.webp', '', m, false, { asSticker: true })
}
handler.help = ['stiker (caption|reply media)', 'stiker <url>', 'stikergif (caption|reply media)', 'stikergif <url>']
handler.tags = ['sticker']
handler.command = /^s(tic?ker)?(gif)?(wm)?$/i
export default handler

const isUrl = (text) => {
  return text.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)(jpe?g|gif|png)/, 'gi'))
}
