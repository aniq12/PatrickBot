import fs from 'fs'
let handler = async (m, { conn, text }) => {
    let who
    if (m.isGroup) who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    else who = text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : m.chat
    let user = db.data.users[who]
    if (!user.premium) return m.reply(conn.getName(who) + ' belum premium')
    user.premium = false
    user.premiumTime = 0
    m.reply(`${conn.getName(who)} sekarang bukan premium!`)
}
handler.help = ['delprem [@user]']
handler.tags = ['owner']
handler.command = /^(remove|hapus|-|del)prem$/i

handler.owner = true

export default handler