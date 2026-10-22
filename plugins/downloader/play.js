import { youtubeSearch } from '@bochilteam/scraper'
import fetch from 'node-fetch'
let handler = async (m, { conn, command, text, usedPrefix }) => {
  if (!text) throw `Use example ${usedPrefix}${command} Minecraft`
  let vid = (await youtubeSearch(text)).video[0]
  if (!vid) throw 'Video/Audio Tidak ditemukan'
  let { title, description, thumbnail, videoId, durationH, viewH, publishedTime } = vid
  const url = 'https://www.youtube.com/watch?v=' + videoId
  await conn.sendButton(m.chat, `
*Title:* ${title}
*Url:* ${url}
*Published:* ${publishedTime}
*Duration:* ${durationH}
*Views:* ${viewH}
  `.trim(), wm, await (await fetch(thumbnail)).buffer(), [['Audio', `${usedPrefix}yta ${url} yes`], ...[360, 480, 720, 1080].map(h => [`Video ${h}p`, `${usedPrefix}ytv ${url} yes ${h}`])])
}
handler.help = ['play', 'play2'].map(v => v + ' <pencarian>')
handler.tags = ['downloader']
handler.command = /^play2?$/i

handler.exp = 0
handler.limit = false

export default handler

