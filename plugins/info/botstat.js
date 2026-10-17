let handler = async (m, { conn }) => {
    let { anon, anticall, antispam, antitroli, backup, jadibot, groupOnly, nsfw } = global.db.data.settings[conn.user.jid]

    let _uptime = process.uptime() * 1000
    let uptime = clockString(_uptime)

    m.reply(`
┌─「 Status 」
│◦❒ Aktif selama ${uptime}
│◦❒ *${Object.keys(global.db.data.users).length}* Pengguna
│◦❒ *${(await conn.fetchBlocklist() || []).length}* Terblock
│◦❒ *${Object.entries(global.db.data.chats).filter(chat => chat[1].isBanned).length}* Chat Terbanned
│◦❒ *${Object.entries(global.db.data.users).filter(user => user[1].banned).length}* Pengguna Terbanned
└────
┌─「 Pengaturan 」
│◦❒ ${anon ? '✅' : '❌'} *Anon Chat*
│◦❒ ${anticall ? '✅' : '❌'} *Anti Call*
│◦❒ ${antispam ? '✅' : '❌'} *Anti Spam*
│◦❒ ${antitroli ? '✅' : '❌'} *Anti Troli*
│◦❒ ${backup ? '✅' : '❌'} *Auto Backup DB*
│◦❒ ${groupOnly ? '✅' : '❌'} *Mode Grup*
│◦❒ ${jadibot ? '✅' : '❌'} *Jadi Bot*
│◦❒ ${nsfw ? '✅' : '❌'} *Mode Nsfw*
└────
    `.trim())
}
handler.help = ['botstatus']
handler.tags = ['info']
handler.command = /^botstat(us)?$/i

export default handler

function clockString(ms) {
    let remain = ms

    let d = isNaN(ms) ? '--' : Math.floor(remain / 86400000) + ' Hari'
    remain = remain % (1000 * 60 * 60 * 24)
    let h = isNaN(ms) ? '--' : Math.floor(remain / 3600000) + ' Jam'
    remain = remain % (1000 * 60 * 60)
    let m = isNaN(ms) ? '--' : Math.floor(remain / 60000) % 60 + ' Min'
    remain = remain % (1000 * 60)
    let s = isNaN(ms) ? '--' : Math.floor(remain / 1000) % 60 + ' Dtk'
    remain = remain % (1000)
    return [d, h, m, s].map(v => v.toString().padStart(2, 0)).join(', ')
}
