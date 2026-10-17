let pajak
import { readFileSync } from 'fs'
let handler = async (m, { conn, text, usedPrefix, command, isPrems }) => {
    if (isPrems) pajak = 0
    else pajak = 0.02
    let fail = `perintah ini buat ngasih limit ke pengguna lain\n\ncontoh:\n${usedPrefix + command} @${conn.user.jid.split`@`[0]} 10\natau balas pesan doi dengan perintah: ${usedPrefix + command} 10`
    let who
    if (m.isGroup) who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : false
    else who = m.chat
    if (!who) {
        conn.reply(m.chat, fail, m, { mentions: conn.parseMention(fail) })
        throw false
    }
    if (typeof global.db.data.users[who] == "undefined") throw 'User tidak terdaftar di dalam database!'
    let txt = text.replace('@' + who.split`@`[0], '').trim()
    if (!txt) {
        conn.reply(m.chat, fail, m, { mentions: conn.parseMention(fail) })
        throw false
    }
    if (isNaN(txt)) throw 'Hanya angka'
    let poin = parseInt(txt)
    let limit = poin
    let pjk = Math.ceil(poin * pajak)
    limit += pjk
    if (limit < 1) throw 'minimal 1'
    let users = global.db.data.users
    if (limit > users[m.sender].limit) throw 'Limit tidak mencukupi untuk mentransfer, ada pajaknya juga'
    users[m.sender].limit -= limit
    users[who].limit += poin

    await m.reply(`(${-poin} Limit) + (${-pjk} Limit (Pajak ${isPrems ? 0 : 2}%)) = ( ${-limit} Limit)`)
    m.reply(`+${poin} Limit`)
}
handler.help = ['paylimit @user <jumlah>']
handler.tags = ['xp']
handler.command = /^payl(imit)?$/

export default handler