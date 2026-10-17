let handler = async (m, { conn, text, usedPrefix, command }) => {
    conn.kirim = conn.kirim ? conn.kirim : []
    let t = text.split`|`
    if (t.length < 3) throw `Penggunaan:\n${usedPrefix + command} nama|nomor target|pesan\n\nContoh:\n${usedPrefix + command} Budi|628123456789|Halo`
    let name = t[0]
    let target = t[1].replace(/[^0-9]/g, '')// + '@s.whatsapp.net'
    let psn = t[2]
    let exist = await conn.onWhatsApp(target + '@s.whatsapp.net')
    if (target.startsWith('08')) throw `Nomor harus berawal dari kode negara\n\ncontoh : 628123456789`
    if (exist.length == 0) throw `Nomor tidak valid`
    await conn.reply(m.chat, `Mengirim pesan ke @${target}...`, m, {
        mentions: [target + '@s.whatsapp.net']
    })
    let a = await conn.reply(target + '@s.whatsapp.net', `Haii, kamu dapat Pesan nih dari *${name}*\n
Pesan : ${psn}

_gesek pesan ini ke kanan untuk membalas_`)
    conn.reply(m.chat, 'berhasil mengirim pesan!')
    let sender = m.chat
    conn.kirim[a.key.id] = [
        sender,
        target + '@s.whatsapp.net',
        psn
    ]
}

handler.help = ['menfess', 'mf'].map(v => v + ' nama|nomor target|pesan')
handler.tags = ['tools']
handler.command = ['menfess', 'mf']

handler.private = true

export default handler
