let handler = async (m, { conn, participants }) => {

    if (m.quoted) {
        await conn.groupParticipantsUpdate(m.chat, [m.quoted.sender], "promote").then(_ => m.reply(done))
    }

    let members = participants.filter(member => member.admin !== 'admin').map(member => member.id)
    let users = m.mentionedJid.filter(user => members.includes(user))
    for (let user of users) {
        await conn.groupParticipantsUpdate(m.chat, [user], "promote").catch(console.log)
        m.reply(done)
    }
}
handler.help = ['promote', 'admin', '^', '↑'].map(v => v + ' @user')
handler.tags = ['admin']

handler.command = /^(promote|admin|\^|↑)$/i

handler.group = true

handler.admin = true
handler.botAdmin = true

export default handler