let handler = async (m, { conn, text }) => {
    conn.reply(m.chat, `
*Pertanyaan:* ${m.text}
*Jawaban:* ${pickRandom(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'])} ${pickRandom(['detik', 'menit', 'jam', 'hari', 'minggu', 'bulan', 'tahun', 'dekade', 'abad'])} lagi ...
`.trim(), m, m.mentionedJid ? {
        mentions: m.mentionedJid 
  } : {})
}
handler.help = ['', 'kah'].map(v => 'kapan' + v + ' <teks>?')
handler.tags = ['kerang']
handler.customPrefix = /(\?$)/
handler.command = /^kapan(kah)?$/i
handler.disabled = true

export default handler

function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)]
}