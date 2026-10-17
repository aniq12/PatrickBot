import { webp2mp4 } from '../../lib/webp2mp4.js'
let handler = async (m, { conn, usedPrefix, command }) => {
    if (!m.quoted) throw `balas stiker dengan perintah *${usedPrefix + command}*`
    let mime = m.quoted.mimetype || ''
    if (!/webp/.test(mime)) throw `balas stiker dengan perintah *${usedPrefix + command}*`
    let media = await m.quoted.download()
    let out = Buffer.alloc(0)
    if (/webp/.test(mime)) {
        out = await webp2mp4(media)
    }
    await conn.sendFile(m.chat, out, 'out.mp4', wm, m, 0, { gifPlayback: true }) // WhatsApp "GIFs" are looping mp4s
}
handler.help = ['togif']
handler.tags = ['sticker']
handler.command = ['togif']

export default handler
