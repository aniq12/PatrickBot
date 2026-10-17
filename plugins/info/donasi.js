// donation methods come from DONATION in .env, one item per "|" (keeps personal numbers out of the code)
let handler = async (m, { conn, usedPrefix: _p }) => {
    const items = (process.env.DONATION || '').split('|').map(v => v.trim()).filter(Boolean)
    if (!items.length) throw 'Info donasi belum diatur (DONATION di .env)'
    await conn.sendButton(m.chat, `
┏ ┅ ━━━━━━「 DONASI 」━━━ ┅ ━
${items.map(v => '┃ ❖ ' + v).join('\n')}
┗ ┅ ━━━━━━━━━━━━━━━━━━━ ┅ ━
Hasil dari *Donasi* akan saya gunakan Untuk Membeli/Menyewa _*RDP/VPS*_ agar bot berjalan 24 jam tanpa kendala,
Terima Kasih.
`.trim(), wm, null, [['👦🏻 Pemilik Bot', _p + 'owner']], m)
}
handler.help = ['donasi']
handler.tags = ['info']
handler.command = /^dona(te|si)$/i

export default handler
