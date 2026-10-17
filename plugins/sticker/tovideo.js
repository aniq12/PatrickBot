import { webp2mp4 } from '../../lib/webp2mp4.js'
import { ffmpeg } from '../../lib/converter.js'
let handler = async (m, { conn, usedPrefix, command }) => {
    if (!m.quoted) throw `Balas stiker/audio yang ingin diubah menjadi video dengan perintah ${usedPrefix + command}`
    let mime = m.quoted.mimetype || ''
    if (!/webp|audio/.test(mime)) throw `Balas stiker/audio yang ingin diubah menjadi video dengan perintah ${usedPrefix + command}`
    let media = await m.quoted.download()
    let out = Buffer.alloc(0)
    if (/webp/.test(mime)) {
        out = await webp2mp4(media)
    } else if (/audio/.test(mime)) {
        const res = await ffmpeg(media, [
            '-filter_complex', 'color',
            '-pix_fmt', 'yuv420p',
            '-crf', '51',
            '-tune', 'zerolatency', // no x264 lookahead, else -shortest overshoots the audio by ~2s
            '-c:a', 'aac', // WhatsApp voice notes are opus, which mp4 players often won't play
            '-shortest'
        ], 'mp3', 'mp4')
        await res.delete()
        out = res.data
    }
    await conn.sendFile(m.chat, out, 'out.mp4', wm, m, 0, { thumbnail: out })
}
handler.help = ['tovideo']
handler.tags = ['sticker']

handler.command = /^tovid(eo)?$/i

export default handler