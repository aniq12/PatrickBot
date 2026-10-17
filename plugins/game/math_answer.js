let handler = m => m
handler.before = async function (m) {
    if (!/^-?[0-9]+(\.[0-9]+)?$/.test(m.text)) return !0
    let id = m.chat
    this.math = this.math ? this.math : {}
    try {
        if (!(id in this.math) && /^Berapa hasil dari/i.test(m.quoted.text)) return m.reply('Soal itu telah berakhir')
        let math = JSON.parse(JSON.stringify(this.math[id][1]))
        if (m.text == math.result) {
            global.db.data.users[m.sender].exp += math.bonus
            clearTimeout(this.math[id][3])
            delete this.math[id]
            await this.sendButton(m.chat, `*✅ Benar!* +${math.bonus} XP`, wm, null, [`${math.mode.toUpperCase()}`, `.math ${math.mode}`], m)
        } else {
            if (--this.math[id][2] == 0) {
                clearTimeout(this.math[id][3])
                delete this.math[id]
                await this.sendButton(m.chat, `*Kesempatan habis!*\nJawaban: *${math.result}*`, wm, null, [`${math.mode.toUpperCase()}`, `.math ${math.mode}`])
            } else m.reply(`*❌ Jawaban Salah!*\nMasih ada ${this.math[id][2]} kesempatan`)
        }
    } catch (e) { return }
    return !0
}

export default handler