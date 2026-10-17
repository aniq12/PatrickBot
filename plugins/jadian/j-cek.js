let handler = async (m, { conn, usedPrefix, text }) => {
    function no(number) {
        return number.replace(/\s/g, '').replace(/([@+-])/g, '')
    }

    text = no(text)

    if (isNaN(text)) {
        var number = text.split`@`[1]
    } else if (!isNaN(text)) {
        var number = text
    }

    if (number.length > 15 || (number.length < 9 && number.length > 0)) return conn.reply(m.chat, `Maaf, Nomor yang anda masukan salah!`, m)

    let user
    let orang
    if (!text && !m.quoted) {
        user = m.sender
        orang = "Kamu"
    } else if (text) {
        user = number + '@s.whatsapp.net'
        orang = "Orang yang kamu tag"
    } else if (m.quoted.sender) {
        user = m.quoted.sender
        orang = "Orang yang kamu balas"
    } else if (m.mentionedJid) {
        user = number + '@s.whatsapp.net'
        orang = "Orang yang kamu tag"
    }

    if (typeof global.db.data.users[user] == "undefined") {
        return m.reply("Target tidak terdaftar di dalam database!")
    }

    if (typeof global.db.data.users[global.db.data.users[user].pasangan] == "undefined" && global.db.data.users[user].pasangan != "") {
        return m.reply("Target tidak terdaftar di dalam database!")
    }

    if (global.db.data.users[user].pasangan == "") {
        conn.reply(m.chat, `${orang} tidak memiliki pasangan dan tidak sedang menembak siapapun\n\n*Ketik .tembak @${orang == "Kamu" ? 'user' : user.split`@`[0]} untuk menembak ${orang == "Kamu" ? 'seseorang' : 'dia'}*`, m, {
            mentions: orang == "Kamu" ? null : [user]
        })
    } else if (global.db.data.users[global.db.data.users[user].pasangan].pasangan != user) {
        conn.reply(m.chat, `${orang} sedang menunggu jawaban dari @${global.db.data.users[user].pasangan.split('@')[0]} karena sedang tidak diterima atau di tolak\n\nKetik *${usedPrefix}ikhlasin* untuk mengikhlaskan!`, m, {
            mentions: [global.db.data.users[user].pasangan]
        })
    } else {
        conn.reply(m.chat, `${orang} sedang menjalani hubungan dengan @${global.db.data.users[user].pasangan.split('@')[0]} 💓💓💓`, m, {
            mentions: [global.db.data.users[user].pasangan]
        })
    }
}
handler.help = ['cekpacar']
handler.tags = ['jadian']
handler.command = /^(cekpacar)$/i
handler.fail = null
export default handler