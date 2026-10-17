let handler = m => m
handler.before = async function (m, { conn, isOwner }) {
    if (!m.quoted || !m.quoted.fromMe || !m.quoted.isBaileys || !/(REPORT|REQUEST)!/i.test(m.quoted.text)) return
    if (!isOwner) throw false
    conn.reply(m.quoted.mentionedJid[0], '*Owner:* ' + m.text, m.quoted)

}
export default handler