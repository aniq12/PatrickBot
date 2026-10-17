let handler = async (m, { conn, participants }) => {
    if (!m.quoted) throw false
    let { chat, fromMe, id, isBaileys } = m.quoted
    let { key } = m.quoted.fakeObj
    let adm = participants.filter(v => v.admin && v.id !== conn.user.jid).map(v => v.id)
    let isAdm = adm.includes(m.sender)
    if (!isAdm && !isBaileys) throw false
    if (adm.includes(key.participant)) throw false
    if (isBaileys) delete key.participant
    conn.sendMessage(chat, {
        delete: key
    })
}
handler.help = ['del', 'delete']
handler.tags = ['info']

handler.command = /^del(ete)?$/i

export default handler
