// the bot's group invite link comes from GROUP_LINK in .env
let handler = async (m, { conn }) => {
    if (!process.env.GROUP_LINK) throw 'Link grup bot belum diatur (GROUP_LINK di .env)'
    await conn.reply(m.chat, process.env.GROUP_LINK, m)
}

handler.help = ['linkgcbot']
handler.tags = ['info']
handler.command = /^link(group|gc)bot$/i

export default handler
