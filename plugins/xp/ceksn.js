import { createHash } from 'crypto'

let Reg = /\|?(.*)([.|] *?)([0-9]*)$/i
let handler = async function (m, { conn, text, usedPrefix, isGroup }) {
    let sn = createHash('md5').update(m.sender).digest('hex')

    if (m.isGroup) {
        conn.reply(m.sender, sn.trim(), m)
        m.reply('Serial number telah di kirim di private chat')
    } else {
        m.reply(sn.trim())
    }
}

handler.help = ['ceksn']
handler.tags = ['xp']
handler.command = /^(ceksn)$/i
handler.register = true

export default handler