const { sticker, addExif } = await import('../../lib/sticker.js')
let handler = async (m, { conn, text, usedPrefix, command }) => {
  let stiker = false
  try {
    let [packname, ...author] = text.split`|`
    author = (author || []).join`|`
    let q = m.quoted ? m.quoted : m
    let mime = m.quoted.mimetype || ''
    if (/webp/.test(mime)) {
      let img = await q.download()
      if (!img) throw `balas stiker dengan perintah ${usedPrefix + command} <packname>|<author>`
      stiker = await addExif(img, packname || '', author || '')
    } else if (/image/.test(mime)) {
      let img = await q.download()
      if (!img) throw `balas gambar dengan perintah ${usedPrefix + command} <packname>|<author>`
      stiker = await sticker(img, false, packname || '', author || '')
    } else if (/video/.test(mime)) {
      if ((q.msg || q).seconds > 11) throw 'Maksimal 10 detik!'
      let img = await q.download()
      if (!img) throw `balas video dengan perintah ${usedPrefix + command} <packname>|<author>`
      stiker = await sticker(img, false, packname || '', author || '')
    }
  } finally {
    if (stiker) await conn.sendFile(m.chat, stiker, '', '', m, false, {
      asSticker: true
    })
    else throw 'Balas stikernya!'
  }
}

handler.help = ['wm <packname>|<author>']
handler.tags = ['sticker']
handler.command = /^wm$/i

handler.limit = true

export default handler