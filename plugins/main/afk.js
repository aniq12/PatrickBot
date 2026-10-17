let handler = async (m, { text }) => {
    let user = global.db.data.users[m.sender]
    user.afk = + new Date
    user.afkReason = text
    await conn.reply(m.chat, `
${conn.getName(m.sender)} sekarang AFK${text ? ': ' + text : ''}`, m, { mentions: conn.parseMention(text) })
}
handler.help = ['afk [alasan]']
handler.tags = ['main']
handler.command = /^afk$/i

export default handler