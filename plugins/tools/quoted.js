let handler = async (m, { conn }) => {
    if (!m.quoted) throw 'Balas pesannya!'
    let q = conn.serializeM(await m.getQuotedObj())
    if (!q.quoted) throw 'Pesan yang anda balas tidak mengandung balasan!'
    await q.quoted.copyNForward(m.chat, true)
}

handler.command = /^q(uoted)?$/i

export default handler