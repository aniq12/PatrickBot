export async function before(m) {
    let kirim = conn.kirim ? conn.kirim : []
    if (!m.quoted) return
    let key = m.quoted ? m.quoted.fakeObj.key.id : ''
    if (m.chat.endsWith('@g.us')) return
    if (!(key in kirim)) return
    let a = await this.reply(kirim[key][0], `Haii, kamu dapat balasan nih\n
Pesan yang kamu kirim : ${kirim[key][2]}
Balasan doi : ${m.text}\n
_gesek pesan ini ke kanan untuk membalas_`)
    await m.reply('berhasil mengirim balasan!')
    let sender = m.chat
    let target = kirim[key][0]
    let psn = m.text
    kirim[a.id] = [
        sender,
        target,
        psn
    ]
    delete kirim[key]
}
