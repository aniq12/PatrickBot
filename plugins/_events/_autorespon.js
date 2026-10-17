let handler = m => m
handler.all = async function (m, { isBlocked }) {
    if (isBlocked) return
    if (m.isBaileys) return
    if (m.chat.endsWith('broadcast')) return

    // ketika ditag
    if (m.isGroup && m.mentionedJid?.includes(this.user.jid)) {
        await this.sendFile(m.chat, './src/Stiker/apasi.webp', 'apasi.webp', '', m, 0, { asSticker: true }).catch(() => { })
    }

    // ketika ada yang invite/kirim link grup di chat pribadi
    if ((m.mtype === 'groupInviteMessage' || m.text.startsWith('https://chat') || m.text.startsWith('Buka tautan ini')) && !m.isGroup) {
        this.sendButton(m.chat, `Ketik\n*.join <linkGroup>*\n\nContoh:\n.join https://chat.whatsapp.com/blabla\n\n*Fitur Khusus Member Premium*
`.trim(), wm, null, ['Pemilik Bot', '.owner'], m)
    }
}

export default handler
