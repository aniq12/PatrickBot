let pajak
import { readFileSync } from 'fs'
let handler = async (m, { conn, text, usedPrefix, command, isPrems }) => {
    if (isPrems) pajak = 0
    else pajak = 0.02
    let fail = `perintah ini buat ngasih XP ke pengguna lain\n\ncontoh:\n${usedPrefix + command} @${conn.user.jid.split`@`[0]} 10\natau balas pesan doi dengan perintah: ${usedPrefix + command} 10`
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
    let xp = parseInt(txt)
    let exp = xp
    let pjk = Math.ceil(xp * pajak)
    exp += pjk
    if (exp < 1) throw 'Minimal 1'
    let users = global.db.data.users
    if (exp > users[m.sender].exp) throw 'Exp tidak mencukupi untuk mentransfer, ada pajaknya juga'
    users[m.sender].exp -= exp
    users[who].exp += xp

    await m.reply(`(${-xp} XP) + (${-pjk} XP (Pajak ${isPrems ? '0' : '2'}%)) = ( ${-exp} XP)`)
    m.reply(`+${xp} XP`)
}
handler.help = ['pay @user <jumlah>']
handler.tags = ['xp']
handler.command = /^pay$/

export default handler