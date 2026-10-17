let handler = async (m, { conn }) => conn.reply(m.chat, `https://chat.whatsapp.com/CW0UnHrX5SWBnqlfZAd4sO`, m, {
    contextInfo: {
        externalAdRepy: {
            suorceUrl: 'https://chat.whatsapp.com/CW0UnHrX5SWBnqlfZAd4sO'
        }
    }
});

handler.help = ['linkgcbot']
handler.tags = ['info']
handler.command = /^link(group|gc)bot$/i

export default handler