let handler = async (m, { conn, command, args }) => {
    let chats
    if (/gro?up|gc/i.test(args[0])) chats = Object.keys(conn.chats).filter(v => v.endsWith('g.us'))
    else if (/chat|private|pc/i.test(args[0])) chats = conn.chats.array.filter(v => v.endsWith('.net'))
    else if (/all/i.test(args[0])) chats = Object.keys(conn.chats).filter(v => v)
    else chats = [m.chat]
    let isDelete = /^(delete)/i.test(command)
    let isClear = /^(clear)/i.test(command)
    m.reply(`me${isDelete ? 'nghapus' : isClear ? 'mbersihkan' : 'mbisukan'} ${chats.length} chat ${args[0] ? args[0] : ''}`)
    for (let id of chats) {
        if (isDelete || isClear) await conn.modifyChat(id, (isDelete ? 'delete' : 'clear'), {
            includeStarred: false
        }).catch(console.log)
        else await conn.chatModify({ mute: - Math.floor(new Date / 1e3) * 1e3 - 1e3 }, id, []).catch(console.log)
    }
    m.reply(`_*Selesai*_`)
}
handler.help = [
    /*'clearchat',
    'clearchat chat',
    'clearchat group',
    'clearchat all',
    'deletechat',
    'deletechat chat',
    'deletechat group',
    'deletechat all',*/
    'mutechat',
    'mutechat chat',
    'mutechat group',
    'mutechat all'
]
handler.tags = ['owner']
handler.command = /^(mute)chat$/i
handler.owner = true

export default handler