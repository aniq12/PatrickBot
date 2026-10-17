import { spawn } from 'child_process'
import { webp2png } from '../../lib/webp2mp4.js'
import util from 'util'

let handler = async (m, { conn, usedPrefix, command }) => {

    if (!m.quoted) throw `balas stiker dengan perintah *${usedPrefix + command}*`
    let mime = m.quoted.mimetype || ''
    if (!/webp/.test(mime)) throw `balas stiker dengan perintah *${usedPrefix + command}*`
    let media = await m.quoted.download()
    let out = Buffer.alloc(0)
    if (/webp/.test(mime)) {
        out = await webp2png(media)
    }
    await conn.sendFile(m.chat, out, 'out.png', wm, m, false, { thumbnail: out })
}
handler.help = ['toimg']
handler.tags = ['sticker']
handler.command = /^toimg$/i

export default handler