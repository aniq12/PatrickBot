import { sticker } from '../../lib/sticker.js'
let handler = m => m

// private chat: any image sent to the bot comes back as a sticker
handler.before = async function (m) {
    if (m.chat.endsWith('@s.whatsapp.net') && !m.fromMe && !m.isBaileys) {
        if (/^.*s(tic?ker)?(gif)?$/i.test(m.text)) return
        let mime = (m.msg || m).mimetype || ''
        if (!/image/.test(mime) || /webp/.test(mime)) return
        let img = await m.download()
        if (!img) return
        let stiker = await sticker(img, false, global.packname, global.author).catch(() => null) // best effort: never block the message
        if (stiker) await this.sendFile(m.chat, stiker, '', '', m, false, {
            asSticker: true
        })
    }
    return true
}

export default handler
