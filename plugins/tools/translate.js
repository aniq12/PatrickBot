import translate from 'translate-google'
let handler = async (m, { conn, args, usedPrefix, command }) => {
    let ey = `${usedPrefix}${command}`
    if (m.msg == ey) return conn.reply(m.chat, `Perintah ini untuk mengtranslate ke bahasa yang anda inginkan
Contoh:
${usedPrefix + command} <code> <pesanmu>
${usedPrefix + command} en selamat pagi
Daftar bahasa yang didukung: https://cloud.google.com/translate/docs/languages
`, m)
    let er = `Perintah ini untuk mengtranslate ke bahasa yang anda inginkan
Contoh:
${usedPrefix + command} <code> <pesanmu>
${usedPrefix + command} en selamat pagi
Daftar bahasa yang didukung: https://cloud.google.com/translate/docs/languages`
    let lang = args[0]
    let text
    if (m.quoted) {
        text = m.quoted.text
    } else {
        text = args.slice(1).join(' ')
    }

    translate(text, { to: lang }).then(async res => {
        await m.reply(res)
    }).catch(async err => {
        await m.reply(err)
    })
}
handler.help = ['translate'].map(v => v + ' <lang> <teks>')

handler.tags = ['tools']
handler.command = /^(tr(anslate)?)$/i

export default handler
