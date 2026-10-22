import { youtubeSearch } from '@bochilteam/scraper'
import { tiktok } from '../../lib/scrape.js'
import { ytdlp, instagram } from '../../lib/ytdlp.js'
import fetch from 'node-fetch'

export async function all(m, { isPrems }) {

    if (m.isCommand) return
    if (m.chat.endsWith('broadcast')) return
    if (db.data.users[m.sender].banned) return
    if (db.data.chats[m.chat].isBanned) return

    const url = m.text.split(/\n| /i)[0]

    if (/https?:\/\/(www\.|v(t|m)\.|t\.)?tiktok\.com/i.test(m.text)) {
        const res = await tiktok(url)
        if (!res.status) throw res.message || eror
        await m.reply(wait)
        if (res.images.length) for (const img of res.images) await conn.sendFile(m.chat, img, 'tiktok.jpg', res.caption, m)
        else await conn.sendFile(m.chat, res.video, 'tiktok.mp4', res.caption, m)
    }

    if (/^.*(fb.watch|facebook.com)/i.test(m.text)) {
        await m.reply(wait)
        const { data } = await ytdlp(url)
        await conn.sendFile(m.chat, data, `facebook.mp4`, wm, m)
    }

    if (/^.*instagram.com\/(p|reel|tv|stories)/i.test(m.text)) {
        await m.reply(wait)
        // needs ./cookies.txt, see lib/ytdlp.js
        for (const { type, media } of await instagram(url)) await conn.sendFile(m.chat, media, type === 'video' ? 'ig.mp4' : 'ig.jpg', wm, m)
    }


    if (/^https?:\/\/.*youtu/i.test(m.text)) {
        let vid = (await youtubeSearch(url)).video[0]
        if (!vid) throw 'Video/Audio Tidak ditemukan'
        let { title, description, thumbnail, videoId, durationH, viewH, publishedTime } = vid
        const link = 'https://www.youtube.com/watch?v=' + videoId
        await conn.sendButton(m.chat, `
📌 *Title:* ${title}
⏲️ *Published:* ${publishedTime}
⌚ *Duration:* ${durationH}
👁️ *Views:* ${viewH}
  `.trim(), wm, await (await fetch(thumbnail)).buffer(), [['Audio 🎧', `/yta ${link} yes`], ...[360, 480, 720, 1080].map(h => [`Video ${h}p 🎥`, `/ytv ${link} yes ${h}`])], m)
    }

}
