import { instagram } from '../../lib/ytdlp.js'

// Instagram only works with login cookies in ./cookies.txt (see lib/ytdlp.js)
let handler = async (m, { conn, args, command, usedPrefix }) => {
  if (!args[0])
    throw `Use example ${usedPrefix}${command} https://www.instagram.com/p/ByxKbUSnubS/?utm_source=ig_web_copy_link`;
  await m.reply(wait)
  const items = await instagram(args[0])
  if (!items.length) throw 'Media tidak ditemukan'
  for (const { type, media } of items) await conn.sendFile(m.chat, media, type === 'video' ? 'ig.mp4' : 'ig.jpg', wm, m)
};
handler.help = ["instagram <url>"];
handler.tags = ["downloader"];

handler.command = /^i(nsta)?g(ram)?(dl)?$/i;

export default handler;
