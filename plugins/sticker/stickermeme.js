import { sticker } from '../../lib/sticker.js'
import { smeme } from '../../lib/canvas.js'
let handler = async (m, { conn, text, usedPrefix, command }) => {

    let [atas, bawah] = text.split`|`
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || ''
    if (!mime) throw `balas gambar dengan perintah\n\n${usedPrefix + command} <${atas ? atas : 'teks atas'}>|<${bawah ? bawah : 'teks bawah'}>`
    if (!/image\/(jpe?g|png)/.test(mime)) throw `_*Mime ${mime} tidak didukung!*_`
    let img = await q.download()
    // made locally with ImageMagick: no upload, the photo never leaves the bot
    let stiker = await sticker(await smeme(img, atas?.trim(), bawah?.trim()), false, global.packname, global.author)
    if (stiker) await conn.sendFile(m.chat, stiker, '', '', m, 0, {
        asSticker: true
    })

}
handler.help = ['stikermeme <teks atas>|<teks bawah>']
handler.tags = ['sticker']
handler.command = /^(s(tic?ker)?meme)$/i

handler.limit = true

export default handler
