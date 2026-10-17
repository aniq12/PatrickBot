import uploadFile from '../../lib/uploadFile.js'

let handler = async (m) => {
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || ''
    if (!mime) throw 'Tidak ada media yang ditemukan'
    let media = await q.download()
    let link = await uploadFile(media)
    m.reply(`${link}
${media.length} Byte(s)
${/catbox\.moe/.test(link) ? '(Tidak Ada Tanggal Kedaluwarsa)' : '(Kedaluwarsa dalam 3 jam)'}`)
}
handler.help = ['upload']
handler.tags = ['tools']
handler.command = /^upload$/i

export default handler
