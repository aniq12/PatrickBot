let handler = async (m, { conn, participants, groupMetadata, text }) => {

    let pp = './src/avatar_contact.png'
    try {
        pp = await conn.profilePictureUrl(m.chat, 'image')
    } catch (e) {
    } finally {
        let { isBanned, welcome, detect, sWelcome, sBye, sPromote, sDemote, antiLink, expired, descUpdate, stiker } = global.db.data.chats[m.chat]
        const groupAdmins = participants.filter(v => v.admin === 'admin').map(v => v.id)
        let listAdmin = groupAdmins.map((v, i) => `${i + 1}. @${v.split`@`[0]}`).join('\n')

        if (text) return m.reply(msToDate(expired - new Date() * 1))

        let caption = `*Informasi Grup*\n
*ID:* 
${groupMetadata.id}
*Nama:* 
${groupMetadata.subject}
*Deskripsi:* 
${groupMetadata.desc.toString()}
*Total Anggota:*
${participants.length} Anggota
*Pembuat Grup:* 
@${groupMetadata.owner.split`@`[0]}
*Admin Grup:*
${listAdmin}
*Pengaturan Bot:*
${antiLink ? '✅' : '❌'} Anti Link
${global.db.data.chats[m.chat].delete ? '❌' : '✅'} Anti Delete
${isBanned ? '✅' : '❌'} Banned
${descUpdate ? '✅' : '❌'} Deskprisi
${detect ? '✅' : '❌'} Detect
${stiker ? '✅' : '❌'} Stiker
${welcome ? '✅' : '❌'} Welcome
*Pengaturan Pesan Bot:*
Welcome: ${sWelcome}
Bye: ${sBye}
Promote: ${sPromote}
Demote: ${sDemote}
*Tersisa:*
${msToDate(expired - new Date() * 1)}
`.trim()
        let mentionedJid = groupAdmins.concat([`${participants.filter(v => v.admin === 'admin').map(v => v.id)}`, `${groupMetadata.owner}`])
        conn.sendFile(m.key.remoteJid, pp, 'pp.jpg', caption, m, 0, { mentions: mentionedJid, thumbnail: Buffer.alloc(0) })
    }
}
handler.help = ['infogrup']
handler.tags = ['group']
handler.command = /^(gro?upinfo|info(gro?up|gc))$/i

handler.group = true

export default handler

function msToDate(ms) {
    let temp = ms
    let days = Math.floor(ms / (24 * 60 * 60 * 1000));
    let daysms = ms % (24 * 60 * 60 * 1000);
    let hours = Math.floor((daysms) / (60 * 60 * 1000));
    let hoursms = ms % (60 * 60 * 1000);
    let minutes = Math.floor((hoursms) / (60 * 1000));
    let minutesms = ms % (60 * 1000);
    let sec = Math.floor((minutesms) / (1000));
    return days + " hari " + hours + " jam " + minutes + " menit";
    // +minutes+":"+sec;
}