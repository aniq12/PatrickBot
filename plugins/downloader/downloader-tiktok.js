import { tiktok } from '../../lib/scrape.js'
let handler = async (m, { conn, args, usedPrefix, command }) => {

    if (!args[0]) return m.reply(`Uhm.. Url nya mana?\n\ncontoh:\n${usedPrefix + command} https://vt.tiktok.com/yqyjPX/`)
    if (!args[0].match(/tiktok/gi)) return m.reply(`Url Salah`)

    const res = await tiktok(args[0])
    if (!res.status) return m.reply(`${eror} atau Video tidak di Temukan`)

    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })
    if (/audio|mp3/i.test(command)) {
        if (!res.audio) return m.reply('Audio tidak ditemukan')
        await conn.sendFile(m.chat, res.audio, 'tiktok.mp3', '', m)
    } else if (res.images.length) {
        for (const img of res.images) await conn.sendFile(m.chat, img, 'tiktok.jpg', res.caption, m)
    } else {
        await conn.sendFile(m.chat, res.video, 'tiktok.mp4', res.caption, m)
    }
    conn.sendMessage(m.chat, { react: { text: null, key: m.key } })
}
handler.help = ['tiktok', 'tiktokmp3'].map(v => v + ' <url>')
handler.tags = ['downloader']
handler.command = /^((tiktok|tt)|((tiktok|tt)(audio|mp3)))$/i

handler.limit = true

export default handler
