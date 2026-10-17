import { ytdlp } from '../../lib/ytdlp.js'

let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!args[0])
    throw `Use example ${usedPrefix}${command} https://fb.watch/f9h98UKcEw/`;
  await m.reply(wait)
  const { data } = await ytdlp(args[0])
  await conn.sendFile(m.chat, data, `facebook.mp4`, wm, m)
};

handler.help = ["facebook"].map((v) => v + " <url>");
handler.tags = ["downloader"];

handler.command = /^((facebook|fb)(downloder|dl)?)$/i;

export default handler;
